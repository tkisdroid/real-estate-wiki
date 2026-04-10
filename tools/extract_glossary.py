"""
에듀랜드 용어해설집 PDF에서 과목별 용어·정의를 추출하여 JSON으로 저장.

산출물:
  sources/terms/extracted/glossary.json
  sources/terms/extracted/{과목}.md  (원시 텍스트, 검증용)

용어 인식 규칙 (폰트/크기 기반):
  - 본문 글자: 약 10.3pt (TT967xxx / TT969Bxxx 등, 파트별 상이)
  - 표제어(용어명): 9.6~10.0pt 사이의 별도 폰트, 본문 폰트와 다른 폰트
  - 각 페이지 상단의 "01"(파트번호)/"공인중개사 용어해설집"/페이지번호/과목명은 헤더로 스킵
  - 한글 자음 섹션 구분(ㄱ,ㄴ,...)은 스킵
  - 파트 타이틀(size >= 14)로 본문 시작 페이지 탐지
"""
import json
import re
from collections import Counter
from pathlib import Path

import fitz  # PyMuPDF


PDF_PATH = Path(r"C:\Users\A\Desktop\LLM_WIKI\real-estate-wiki\sources\terms\1. 에듀랜드 용어해설집.pdf")
OUT_DIR = Path(r"C:\Users\A\Desktop\LLM_WIKI\real-estate-wiki\sources\terms\extracted")

PARTS = [
    ("부동산학개론", "부동산학개론"),
    ("민법 및 민사특별법", "민법및민사특별법"),
    ("공인중개사 법령 및 중개실무", "공인중개사법령및중개실무"),
    ("부동산공시법", "부동산공시법"),
    ("부동산세법", "부동산세법"),
    ("부동산공법", "부동산공법"),
]

GROUP_LETTERS = set("ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ")


def is_header_text(text: str) -> bool:
    t = text.strip()
    if not t:
        return True
    if t == "공인중개사 용어해설집":
        return True
    if re.fullmatch(r"\d{1,3}", t):
        return True
    if re.fullmatch(r"0[1-6]", t):
        return True
    if re.fullmatch(
        r"[1-6]\.?\s*(부동산학개론|민법\s*및\s*민사특별법|공인중개사\s*법령\s*및\s*중개실무|부동산공시법|부동산세법|부동산공법)",
        t,
    ):
        return True
    if len(t) == 1 and t in GROUP_LETTERS:
        return True
    for title, _ in PARTS:
        if t == title:
            return True
    return False


def classify_line(line) -> dict:
    text = ""
    max_size = 0.0
    fc = Counter()
    for span in line["spans"]:
        text += span["text"]
        if span["size"] > max_size:
            max_size = span["size"]
        fc[span["font"]] += max(1, len(span["text"]))
    primary_font = fc.most_common(1)[0][0] if fc else ""
    return {"text": text, "size": max_size, "font": primary_font}


def extract_lines(doc):
    """[(page_idx, line_info)] in reading order."""
    out = []
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        blocks = page.get_text("dict")["blocks"]
        lines_with_y = []
        for blk in blocks:
            if blk["type"] != 0:
                continue
            for line in blk["lines"]:
                if not line["spans"]:
                    continue
                y = line["bbox"][1]
                info = classify_line(line)
                lines_with_y.append((y, info))
        lines_with_y.sort(key=lambda x: x[0])
        for _, info in lines_with_y:
            out.append((page_idx, info))
    return out


def detect_body_fonts(lines):
    """가장 많이 쓰인 (size, font) 조합을 본문 폰트로 간주."""
    c = Counter()
    for _, info in lines:
        c[(round(info["size"], 1), info["font"])] += len(info["text"])
    common = c.most_common(10)
    body = set()
    # 본문은 일반적으로 10.3 크기
    for (sz, font), _ in common:
        if 10.0 <= sz <= 10.6:
            body.add(font)
    return body


def find_part_boundaries(lines):
    boundaries = {}
    for page_idx, info in lines:
        t = info["text"].strip()
        if info["size"] < 14:
            continue
        for title, key in PARTS:
            if key in boundaries:
                continue
            if title in t:
                boundaries[key] = page_idx
    return boundaries


def is_term_heading(info, body_fonts: set) -> bool:
    t = info["text"].strip()
    if not t or is_header_text(t):
        return False
    sz = info["size"]
    # 표제어는 본문보다 살짝 작은 9.5~10.1pt 별도 폰트
    if sz < 9.3 or sz > 10.2:
        return False
    # 본문 폰트가 아닌 경우만 후보
    if info["font"] in body_fonts:
        return False
    # 숫자/기호만
    if re.fullmatch(r"[\d\.\-\s·]+", t):
        return False
    # 지나치게 긴 라인(정의 강조일 가능성)
    if len(t) > 60:
        return False
    # 문장 부호로 끝나면 정의 일부
    if t.endswith(("다.", "이다.", "한다.", "있다.", "없다.", "된다.", "한다", "된다")):
        return False
    # 공백으로 시작하는 들여쓴 라인 제외
    if info["text"].startswith((" ", "\t")):
        return False
    return True


def parse_terms(lines, boundaries, body_fonts):
    ordered = sorted(boundaries.items(), key=lambda x: x[1])
    ranges = []
    for i, (key, start) in enumerate(ordered):
        end = ordered[i + 1][1] if i + 1 < len(ordered) else 10**9
        ranges.append((key, start, end))

    def subject_of(page_idx):
        for key, s, e in ranges:
            if s <= page_idx < e:
                return key
        return None

    entries = []
    current = None
    for page_idx, info in lines:
        subj = subject_of(page_idx)
        if subj is None:
            continue
        text = info["text"].strip()
        if is_header_text(text):
            continue
        if is_term_heading(info, body_fonts):
            if current and current["lines"]:
                entries.append(current)
            current = {
                "subject": subj,
                "term": text,
                "lines": [],
                "start_page": page_idx + 1,
            }
        else:
            if current is None:
                continue
            current["lines"].append(text)
    if current and current["lines"]:
        entries.append(current)

    cleaned = []
    for e in entries:
        body = " ".join(e["lines"])
        body = re.sub(r"\s+", " ", body).strip()
        if len(body) < 10:
            continue
        cleaned.append(
            {
                "subject": e["subject"],
                "term": e["term"],
                "definition": body,
                "page": e["start_page"],
            }
        )
    return cleaned


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[open] {PDF_PATH.name}")
    doc = fitz.open(str(PDF_PATH))
    print(f"  pages: {len(doc)}")

    lines = extract_lines(doc)
    print(f"  lines: {len(lines)}")

    body_fonts = detect_body_fonts(lines)
    print(f"  body fonts: {body_fonts}")

    boundaries = find_part_boundaries(lines)
    print("  part boundaries (PDF 0-based):")
    for k, v in sorted(boundaries.items(), key=lambda x: x[1]):
        print(f"    {k}: {v}")

    entries = parse_terms(lines, boundaries, body_fonts)
    print(f"  parsed terms: {len(entries)}")

    by_subj = {}
    for e in entries:
        by_subj.setdefault(e["subject"], []).append(e)
    for k, v in by_subj.items():
        print(f"    - {k}: {len(v)}")

    out_json = OUT_DIR / "glossary.json"
    out_json.write_text(
        json.dumps(
            {
                "source": str(PDF_PATH),
                "total": len(entries),
                "by_subject": {k: len(v) for k, v in by_subj.items()},
                "entries": entries,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"  -> {out_json}")

    for subj, items in by_subj.items():
        out_md = OUT_DIR / f"{subj}.md"
        parts = [f"# {subj} 용어해설 (raw, {len(items)}개)\n"]
        for e in items:
            parts.append(f"## {e['term']}  <sub>p.{e['page']}</sub>")
            parts.append(e["definition"])
            parts.append("")
        out_md.write_text("\n".join(parts), encoding="utf-8")
        print(f"  -> {out_md}")

    doc.close()


if __name__ == "__main__":
    main()
