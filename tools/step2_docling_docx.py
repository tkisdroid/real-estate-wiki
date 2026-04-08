"""Step 2: docling으로 DOCX → 구조화 마크다운 + JSON 변환"""
import gc
import json
import sys
from pathlib import Path

from docling.document_converter import DocumentConverter


def main():
    docling_dir = Path(r"C:\Users\TG\Desktop\LLMproject\sources\laws\docling")
    docx_files = sorted(docling_dir.glob("*.docx"))
    print(f"DOCX 파일 {len(docx_files)}개 docling 변환 시작\n")

    converter = DocumentConverter()
    ok = 0

    for f in docx_files:
        print(f"  {f.name}", end=" ... ", flush=True)
        try:
            result = converter.convert(str(f))
            doc = result.document

            md = doc.export_to_markdown()
            jd = doc.model_dump()

            md_path = docling_dir / (f.stem + ".md")
            md_path.write_text(md, encoding="utf-8")

            json_path = docling_dir / (f.stem + ".json")
            json_path.write_text(
                json.dumps(jd, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )

            print(f"OK ({len(md):,} chars)")
            ok += 1

            del result, doc
            gc.collect()

        except Exception as e:
            print(f"실패: {type(e).__name__}: {e}")

    print(f"\n완료: {ok}/{len(docx_files)}")


if __name__ == "__main__":
    main()
