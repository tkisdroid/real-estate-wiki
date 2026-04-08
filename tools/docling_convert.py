"""
docling을 사용하여 sources/ 디렉토리의 교재(PDF)와 법령(DOC) 파일을
구조화된 마크다운 및 JSON(DoclingDocument)으로 변환.

전략:
- DOC: Word COM 으로 DOCX 변환 → docling 처리
- PDF: PyMuPDF 로 50 페이지 분할 → docling 처리 → 병합
- HWP: 미지원 스킵
"""
import gc
import json
import os
import sys
import tempfile
from pathlib import Path

import fitz  # PyMuPDF

# ── DOC → DOCX 변환 (Word COM) ──────────────────────────────

def doc_to_docx_via_com(doc_path: Path, out_dir: Path) -> Path | None:
    """Word COM으로 .doc → .docx 변환. 성공 시 docx 경로 반환."""
    import win32com.client
    import pythoncom

    pythoncom.CoInitialize()
    word = None
    try:
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        word.DisplayAlerts = 0  # wdAlertsNone

        docx_name = doc_path.stem + ".docx"
        docx_path = out_dir / docx_name

        doc = word.Documents.Open(str(doc_path.resolve()))
        doc.SaveAs2(str(docx_path.resolve()), FileFormat=16)  # 16 = wdFormatDocumentDefault (.docx)
        doc.Close(SaveChanges=0)
        return docx_path
    except Exception as e:
        print(f"      COM 변환 실패: {e}")
        return None
    finally:
        if word:
            word.Quit()
        pythoncom.CoUninitialize()


# ── docling 변환 함수 ────────────────────────────────────────

def docling_convert_docx(docx_path: Path) -> tuple[str, dict] | None:
    """DOCX → (markdown, json_dict)"""
    from docling.document_converter import DocumentConverter

    converter = DocumentConverter()
    result = converter.convert(str(docx_path))
    doc = result.document

    md = doc.export_to_markdown()
    jd = doc.model_dump()

    del result, doc, converter
    gc.collect()
    return md, jd


def docling_convert_pdf_chunk(chunk_path: str) -> tuple[str, dict] | None:
    """PDF 청크 → (markdown, json_dict)"""
    from docling.document_converter import DocumentConverter, PdfFormatOption
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import PdfPipelineOptions

    opts = PdfPipelineOptions()
    opts.do_ocr = False
    opts.do_table_structure = True

    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=opts)
        }
    )
    result = converter.convert(chunk_path)
    doc = result.document

    md = doc.export_to_markdown()
    jd = doc.model_dump()

    del result, doc, converter
    gc.collect()
    return md, jd


# ── PDF 분할 ─────────────────────────────────────────────────

def split_pdf(pdf_path: Path, chunk_size: int = 50):
    """PDF를 chunk_size 페이지 단위 임시 파일로 분할."""
    src = fitz.open(str(pdf_path))
    total = len(src)
    chunks = []
    for start in range(0, total, chunk_size):
        end = min(start + chunk_size, total)
        tmp = fitz.open()
        tmp.insert_pdf(src, from_page=start, to_page=end - 1)
        fp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
        tmp.save(fp.name)
        tmp.close()
        fp.close()
        chunks.append((fp.name, start + 1, end))
    src.close()
    return chunks, total


# ── 파일 단위 처리 ───────────────────────────────────────────

def process_doc(doc_path: Path, output_dir: Path, tmp_dir: Path) -> bool:
    print(f"  [{doc_path.name}]")

    # 1) Word COM → DOCX
    print("    1) DOC → DOCX (Word COM)...", end=" ", flush=True)
    docx_path = doc_to_docx_via_com(doc_path, tmp_dir)
    if docx_path is None:
        return False
    print("OK")

    # 2) docling 변환
    print("    2) docling 변환...", end=" ", flush=True)
    try:
        md, jd = docling_convert_docx(docx_path)
    except Exception as e:
        print(f"실패: {e}")
        return False
    finally:
        docx_path.unlink(missing_ok=True)
    print(f"OK ({len(md):,} chars)")

    # 3) 저장
    stem = doc_path.stem
    (output_dir / f"{stem}.md").write_text(md, encoding="utf-8")
    (output_dir / f"{stem}.json").write_text(
        json.dumps(jd, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"    -> {stem}.md / {stem}.json")
    return True


def process_pdf(pdf_path: Path, output_dir: Path) -> bool:
    print(f"\n  [{pdf_path.name}]")

    chunks, total = split_pdf(pdf_path, chunk_size=50)
    print(f"    {total}p → {len(chunks)} 청크")

    all_md, all_jd = [], []
    for i, (fp, s, e) in enumerate(chunks):
        tag = f"p.{s}-{e}"
        print(f"    청크 {i+1}/{len(chunks)} ({tag})...", end=" ", flush=True)
        try:
            md, jd = docling_convert_pdf_chunk(fp)
            all_md.append(f"<!-- {tag} -->\n\n{md}")
            all_jd.append({"pages": tag, "data": jd})
            print(f"OK ({len(md):,})")
        except Exception as e:
            print(f"실패: {type(e).__name__}")
        finally:
            os.unlink(fp)
            gc.collect()

    if not all_md:
        return False

    stem = pdf_path.stem
    (output_dir / f"{stem}.md").write_text(
        "\n\n".join(all_md), encoding="utf-8"
    )
    (output_dir / f"{stem}.json").write_text(
        json.dumps(all_jd, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"    -> {stem}.md / {stem}.json")
    return True


# ── main ─────────────────────────────────────────────────────

def main():
    base = Path(r"C:\Users\TG\Desktop\LLMproject\sources")
    tmp_dir = Path(tempfile.mkdtemp(prefix="docling_"))

    # ── 법령 DOC ──
    laws_dir = base / "laws"
    laws_out = laws_dir / "docling"
    laws_out.mkdir(exist_ok=True)

    print("=" * 60)
    print(" 법령 (DOC) 변환")
    print("=" * 60)

    doc_files = sorted(laws_dir.glob("*.doc"))
    hwp_files = sorted(laws_dir.glob("*.hwp"))
    ok = 0
    for f in doc_files:
        if process_doc(f, laws_out, tmp_dir):
            ok += 1
    for f in hwp_files:
        print(f"  [스킵] {f.name} (HWP 미지원)")
    print(f"\n  법령 완료: {ok}/{len(doc_files)} 성공\n")

    # ── 교재 PDF ──
    tb_dir = base / "textbooks"
    tb_out = tb_dir / "docling"
    tb_out.mkdir(exist_ok=True)

    print("=" * 60)
    print(" 교재 (PDF) 변환  [OCR off · 50p 청크]")
    print("=" * 60)

    pdf_files = sorted(tb_dir.glob("*.pdf"))
    ok = 0
    for f in pdf_files:
        if process_pdf(f, tb_out):
            ok += 1
    print(f"\n  교재 완료: {ok}/{len(pdf_files)} 성공\n")

    # cleanup
    import shutil
    shutil.rmtree(tmp_dir, ignore_errors=True)

    print("=" * 60)
    print(" 전체 완료!")
    print(f"  법령: {laws_out}")
    print(f"  교재: {tb_out}")
    print("=" * 60)


if __name__ == "__main__":
    main()
