"""
glossary.json을 읽어 wiki/concepts/용어해설집_{과목}.md 6개 허브 페이지를 생성.

- 각 페이지는 과목별 전체 용어를 PDF 출현 순서대로 나열(자음 그룹 순)
- 용어명이 기존 concepts 페이지 제목과 일치하면 "→ [[concepts/xxx]]" 링크 자동 삽입
- 기존 concepts 파일은 건드리지 않음 (링크 체커/라우팅과 완전 호환)
"""
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(r"C:\Users\A\Desktop\LLM_WIKI\real-estate-wiki")
GLOSSARY_JSON = ROOT / "sources" / "terms" / "extracted" / "glossary.json"
CONCEPTS_DIR = ROOT / "wiki" / "concepts"

TODAY = date.today().isoformat()

SUBJECT_TITLE = {
    "부동산학개론": "부동산학개론",
    "민법및민사특별법": "민법 및 민사특별법",
    "공인중개사법령및중개실무": "공인중개사법령 및 중개실무",
    "부동산공시법": "부동산공시법",
    "부동산세법": "부동산세법",
    "부동산공법": "부동산공법",
}


def load_existing_concept_titles():
    """wiki/concepts/ 의 기존 페이지 제목(파일명 stem) 집합."""
    titles = set()
    for f in CONCEPTS_DIR.glob("*.md"):
        titles.add(f.stem)
    return titles


def normalize_for_match(s: str) -> str:
    """용어명에서 한자/괄호/공백 제거하고 핵심 한글만 남겨 매칭용 키 생성."""
    # 괄호와 그 안의 내용 제거: "가격과 가치(價格과 價値)" → "가격과 가치"
    s = re.sub(r"\([^)]*\)", "", s)
    s = re.sub(r"（[^）]*）", "", s)
    # 구두점/공백 제거
    s = re.sub(r"[\s\.\,\-·：:／/]+", "", s)
    return s.strip()


def build_match_index(titles: set):
    """concept 파일 stem 을 정규화 키 → 원본 stem 맵으로 변환."""
    idx = {}
    for t in titles:
        key = normalize_for_match(t)
        if key and key not in idx:
            idx[key] = t
    return idx


def find_concept_link(term: str, match_idx: dict):
    """용어명이 기존 concept 페이지와 매칭되면 wikilink 반환."""
    key = normalize_for_match(term)
    if not key:
        return None
    if key in match_idx:
        return match_idx[key]
    return None


def clean_definition(text: str) -> str:
    """정의 본문 정리 — 과도한 공백·중점 통일."""
    t = text
    # 중점류 통일
    t = t.replace("․", "·").replace("ㆍ", "·")
    # 연속 공백 정리
    t = re.sub(r"\s+", " ", t).strip()
    return t


def build_page(subject_key: str, entries: list, match_idx: dict) -> str:
    title_ko = SUBJECT_TITLE[subject_key]
    total = len(entries)

    fm = [
        "---",
        f"title: 용어해설집 ({title_ko})",
        "category: concepts",
        f"subject: {subject_key}",
        "tags: [용어해설, 용어사전, 기본서부록, 개념정리]",
        "sources: [에듀랜드 2026 용어해설집]",
        f"created: {TODAY}",
        f"updated: {TODAY}",
        "importance: medium",
        "---",
        "",
    ]

    body = [
        f"# 용어해설집 — {title_ko}",
        "",
        f"> **에듀랜드 2026 용어해설집 PDF**에서 추출한 {title_ko} 관련 핵심 용어 **{total}개** 해설. "
        "시험 직전 개념 확인용 레퍼런스.",
        "",
        "> 표기: **→** 표시는 해당 용어에 대한 전용 개념 페이지가 이미 있는 경우 해당 위키 페이지로 이동하는 링크입니다.",
        "",
        "---",
        "",
    ]

    for e in entries:
        term = e["term"].strip()
        definition = clean_definition(e["definition"])
        # 용어명 내부 중점 통일
        term_display = term.replace("․", "·").replace("ㆍ", "·")

        link_target = find_concept_link(term, match_idx)
        heading = f"### {term_display}"
        if link_target:
            heading += f"  →  [[concepts/{link_target}|{link_target}]]"

        body.append(heading)
        body.append("")
        body.append(definition)
        body.append("")
        body.append(f"<sub>📖 p.{e['page']}</sub>")
        body.append("")

    return "\n".join(fm + body)


def main():
    data = json.loads(GLOSSARY_JSON.read_text(encoding="utf-8"))
    entries = data["entries"]

    titles = load_existing_concept_titles()
    match_idx = build_match_index(titles)
    print(f"existing concept pages: {len(titles)}, match keys: {len(match_idx)}")

    by_subj = {}
    for e in entries:
        by_subj.setdefault(e["subject"], []).append(e)

    created = []
    for subj, items in by_subj.items():
        page = build_page(subj, items, match_idx)
        out_path = CONCEPTS_DIR / f"용어해설집_{subj}.md"
        out_path.write_text(page, encoding="utf-8")
        print(f"  wrote {out_path.name}  ({len(items)} terms, {len(page):,} chars)")
        created.append(out_path.name)

    # 매칭 통계
    matched = 0
    for e in entries:
        if find_concept_link(e["term"], match_idx):
            matched += 1
    print(f"  matched to existing concepts: {matched}/{len(entries)}")

    print(f"\ncreated {len(created)} pages")


if __name__ == "__main__":
    main()
