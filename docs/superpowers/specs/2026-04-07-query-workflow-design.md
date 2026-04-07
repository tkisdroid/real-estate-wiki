# Design: Query 워크플로우 (검색 강화 + Source 폴백)

**Date:** 2026-04-07
**Status:** APPROVED

## Problem

Karpathy LLM Wiki 패턴의 Query 워크플로우가 미구현. 사용자가 위키에 없는 키워드를 검색하면 결과 없음으로 끝남. 원본 자료(sources/)에 있는 내용도 발견 불가. 검색 갭이 위키 성장에 반영되지 않음.

## Solution

3단계 검색 파이프라인 + 갭 기록 + 위키 승격 워크플로우.

### 검색 흐름

```
사용자 검색어 입력
  ↓
[1단계] 위키 키워드 매칭 (search-index.json)
  → 결과 있음 → 위키 페이지 표시
  → 결과 없음 ↓

[2단계] 유사 키워드 제안 (퍼지 매칭)
  → 유사어 있음 → "이것을 찾으셨나요?" + 위키 링크 제안
  → 유사어도 없음 ↓

[3단계] Source 폴백 검색 (source-index.json)
  → 원본 자료에서 발췌 표시 (위키와 시각적 구분)
  → 검색 갭 localStorage에 기록
```

## Components

### A. 유사 키워드 제안 (클라이언트)
- 한글 자소 분리 기반 퍼지 매칭
- 초성 검색 (ㅈㅅㄱ → 전세권)
- Levenshtein 거리 기반 유사도 계산
- 검색 결과 0건일 때 상위 5개 유사 키워드 제안

### B. Source 검색 인덱스 (빌드 타임)
- `scripts/build-source-index.js` — sources/ 텍스트 추출 → source-index.json
- 법령, 교재 텍스트를 단락 단위로 인덱싱
- 검색 결과에 "원본 자료" 배지로 위키 페이지와 구분
- source-index.json 크기 예산: 500KB 이하 (gzip)

### C. 검색 갭 기록 (클라이언트)
- 검색 결과 0건 키워드를 localStorage에 기록
- 홈 대시보드에 "요청된 주제" 목록 표시
- 운영자가 위키 페이지 생성 시 참고

### D. 위키 재저장 CLI 스크립트
- `npm run wiki:promote` — source 발췌 → 위키 마크다운 템플릿 생성
- CLAUDE.md의 페이지 형식(frontmatter, 핵심 암기, OX 퀴즈, 함정 노트) 준수
- log.md에 자동 기록

## Tech Stack
- 프론트엔드: 기존 Next.js 정적 앱 (GitHub Pages)
- 빌드: Node.js 스크립트
- 서버 추가: 불필요

## Out of Scope
- 실시간 LLM 호출 (챗봇)
- 관리자 웹 페이지
- 사용자 인증

## Success Criteria
- 퍼지 매칭으로 "전세" → "전세권" 연결 성공률 80%+
- Source 폴백으로 위키 미커버 키워드 검색 가능
- 검색 갭 기록이 대시보드에 표시
