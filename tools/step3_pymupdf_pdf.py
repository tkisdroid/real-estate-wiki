"""
Step 3: PyMuPDF로 PDF 교재를 구조화된 마크다운/JSON으로 변환.
docling PDF 파이프라인이 CPU 환경에서 너무 무거워 대안으로 사용.
"""
import json
import re
from pathlib import Path
import fitz  # PyMuPDF


def extract_structured_page(page):
    """한 페이지에서 텍스트 블록을 추출하고 구조화"""
    blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]
    elements = []

    for block in blocks:
        if block["type"] == 0:  # text block
            for line in block["lines"]:
                text = ""
                max_size = 0
                is_bold = False
                for span in line["spans"]:
                    text += span["text"]
                    max_size = max(max_size, span["size"])
                    if "bold" in span["font"].lower() or "Bold" in span["font"]:
                        is_bold = True

                text = text.strip()
                if not text:
                    continue

                # 글자 크기로 제목 수준 판단
                if max_size >= 16:
                    elements.append({"type": "h1", "text": text})
                elif max_size >= 13 and is_bold:
                    elements.append({"type": "h2", "text": text})
                elif max_size >= 11 and is_bold:
                    elements.append({"type": "h3", "text": text})
                elif is_bold:
                    elements.append({"type": "bold", "text": text})
                else:
                    elements.append({"type": "text", "text": text})

        elif block["type"] == 1:  # image block
            elements.append({"type": "image", "text": "[이미지]"})

    return elements


def elements_to_markdown(elements):
    """구조화된 요소를 마크다운으로 변환"""
    lines = []
    prev_type = None

    for el in elements:
        t = el["type"]
        text = el["text"]

        if t == "h1":
            lines.append(f"\n# {text}\n")
        elif t == "h2":
            lines.append(f"\n## {text}\n")
        elif t == "h3":
            lines.append(f"\n### {text}\n")
        elif t == "bold":
            lines.append(f"\n**{text}**\n")
        elif t == "image":
            lines.append("\n[이미지]\n")
        else:
            lines.append(text)

        prev_type = t

    return "\n".join(lines)


def process_pdf(pdf_path, output_dir):
    """PDF 파일을 구조화된 마크다운 + JSON으로 변환"""
    stem = pdf_path.stem
    print(f"\n  [{pdf_path.name}]")

    doc = fitz.open(str(pdf_path))
    total = len(doc)
    print(f"    {total} 페이지")

    all_elements = []
    all_md_parts = []

    for i in range(total):
        page = doc[i]
        elements = extract_structured_page(page)
        all_elements.append({
            "page": i + 1,
            "elements": elements
        })

        md = elements_to_markdown(elements)
        if md.strip():
            all_md_parts.append(f"<!-- 페이지 {i+1} -->\n\n{md}")

        if (i + 1) % 50 == 0:
            print(f"    {i+1}/{total} 페이지 처리...", flush=True)

    doc.close()

    # 마크다운 저장
    md_path = output_dir / f"{stem}.md"
    merged_md = "\n\n---\n\n".join(all_md_parts)
    md_path.write_text(merged_md, encoding="utf-8")
    print(f"    -> {md_path.name} ({len(merged_md):,} chars)")

    # JSON 저장
    json_path = output_dir / f"{stem}.json"
    json_data = {
        "source": str(pdf_path),
        "method": "pymupdf_structured",
        "total_pages": total,
        "pages": all_elements
    }
    json_path.write_text(
        json.dumps(json_data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    print(f"    -> {json_path.name}")
    return True


def main():
    tb_dir = Path(r"C:\Users\TG\Desktop\LLMproject\sources\textbooks")
    out_dir = tb_dir / "docling"
    out_dir.mkdir(exist_ok=True)

    pdf_files = sorted(tb_dir.glob("*.pdf"))
    print(f"PDF 교재 {len(pdf_files)}개 변환 시작\n")

    ok = 0
    for f in pdf_files:
        # 이미 변환된 파일 스킵
        md_path = out_dir / (f.stem + ".md")
        if md_path.exists() and md_path.stat().st_size > 0:
            print(f"\n  [{f.name}] 이미 존재 - 스킵")
            ok += 1
            continue

        if process_pdf(f, out_dir):
            ok += 1

    print(f"\n\n교재 변환 완료: {ok}/{len(pdf_files)}")


if __name__ == "__main__":
    main()
