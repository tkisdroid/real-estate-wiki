"""Step 3: docling으로 PDF 교재를 50페이지 청크 단위 변환"""
import gc
import json
import os
import sys
import tempfile
from pathlib import Path

import fitz  # PyMuPDF

from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions


def split_pdf(pdf_path, chunk_size=50):
    """PDF를 chunk_size 페이지 단위로 분할"""
    src = fitz.open(str(pdf_path))
    total = len(src)
    chunks = []
    for start in range(0, total, chunk_size):
        end = min(start + chunk_size, total)
        tmp_doc = fitz.open()
        tmp_doc.insert_pdf(src, from_page=start, to_page=end - 1)
        fp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
        tmp_doc.save(fp.name)
        tmp_doc.close()
        fp.close()
        chunks.append((fp.name, start + 1, end))
    src.close()
    return chunks, total


def make_converter():
    opts = PdfPipelineOptions()
    opts.do_ocr = False
    opts.do_table_structure = False  # 메모리 절약
    return DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=opts)
        }
    )


def main():
    tb_dir = Path(r"C:\Users\TG\Desktop\LLMproject\sources\textbooks")
    out_dir = tb_dir / "docling"
    out_dir.mkdir(exist_ok=True)

    pdf_files = sorted(tb_dir.glob("*.pdf"))
    print(f"PDF 교재 {len(pdf_files)}개 변환 시작\n")

    total_ok = 0
    for pdf_path in pdf_files:
        stem = pdf_path.stem
        print(f"\n{'='*60}")
        print(f"  {pdf_path.name}")

        chunks, total = split_pdf(pdf_path, chunk_size=50)
        print(f"  {total}페이지 → {len(chunks)}개 청크")

        all_md = []
        all_json = []
        chunk_ok = 0

        for i, (fp, s, e) in enumerate(chunks):
            tag = f"p.{s}-{e}"
            print(f"    청크 {i+1}/{len(chunks)} ({tag})...", end=" ", flush=True)
            try:
                converter = make_converter()
                result = converter.convert(fp)
                doc = result.document

                md = doc.export_to_markdown()
                jd = doc.model_dump()
                all_md.append(f"<!-- {tag} -->\n\n{md}")
                all_json.append({"pages": tag, "data": jd})
                chunk_ok += 1
                print(f"OK ({len(md):,})")

                del result, doc, converter
            except Exception as e:
                print(f"실패: {type(e).__name__}")
            finally:
                os.unlink(fp)
                gc.collect()

        if all_md:
            (out_dir / f"{stem}.md").write_text(
                "\n\n".join(all_md), encoding="utf-8"
            )
            (out_dir / f"{stem}.json").write_text(
                json.dumps(all_json, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )
            print(f"  -> {stem}.md / .json ({chunk_ok}/{len(chunks)} 청크)")
            total_ok += 1

    print(f"\n\n교재 변환 완료: {total_ok}/{len(pdf_files)}")


if __name__ == "__main__":
    main()
