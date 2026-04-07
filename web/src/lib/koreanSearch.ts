// Korean fuzzy search utilities: Jamo decomposition, Chosung search, Levenshtein distance

const CHOSUNG = [
  "ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ",
  "ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ",
];

const JUNGSUNG = [
  "ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ",
  "ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ",
];

const JONGSUNG = [
  "","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ",
  "ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ",
  "ㅋ","ㅌ","ㅍ","ㅎ",
];

function isKoreanChar(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= 0xAC00 && code <= 0xD7A3;
}

function isChosung(ch: string): boolean {
  return CHOSUNG.includes(ch);
}

/** Decompose a Korean syllable into jamo array */
function decompose(ch: string): string[] {
  if (!isKoreanChar(ch)) return [ch.toLowerCase()];
  const code = ch.charCodeAt(0) - 0xAC00;
  const cho = Math.floor(code / (21 * 28));
  const jung = Math.floor((code % (21 * 28)) / 28);
  const jong = code % 28;
  const result = [CHOSUNG[cho], JUNGSUNG[jung]];
  if (jong > 0) result.push(JONGSUNG[jong]);
  return result;
}

/** Get chosung string from Korean text */
export function getChosung(text: string): string {
  return text
    .split("")
    .map((ch) => {
      if (isKoreanChar(ch)) {
        const code = ch.charCodeAt(0) - 0xAC00;
        return CHOSUNG[Math.floor(code / (21 * 28))];
      }
      return ch;
    })
    .join("");
}

/** Decompose entire string into jamo */
export function decomposeString(text: string): string {
  return text
    .split("")
    .flatMap((ch) => decompose(ch))
    .join("");
}

/** Check if query is all chosung (e.g., ㅈㅅㄱ) */
export function isChosungQuery(query: string): boolean {
  return query.length > 1 && query.split("").every((ch) => isChosung(ch) || ch === " ");
}

/** Levenshtein distance */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export interface FuzzyResult {
  index: number;
  title: string;
  score: number; // 0 = perfect match, higher = worse
  matchType: "exact" | "contains" | "chosung" | "jamo" | "levenshtein";
}

/**
 * Fuzzy search: returns matching indices sorted by relevance.
 * titles: array of page titles to search against
 * query: user's search input
 */
export function fuzzySearch(
  titles: string[],
  query: string,
  maxResults: number = 5
): FuzzyResult[] {
  if (!query.trim()) return [];

  const q = query.trim().toLowerCase();
  const qDecomposed = decomposeString(q);
  const qChosung = isChosungQuery(q) ? q : null;
  const results: FuzzyResult[] = [];

  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    const tLower = title.toLowerCase();

    // Exact substring match
    if (tLower.includes(q)) {
      results.push({ index: i, title, score: 0, matchType: "exact" });
      continue;
    }

    // Chosung match (ㅈㅅㄱ → 전세권)
    if (qChosung) {
      const tChosung = getChosung(title);
      if (tChosung.includes(qChosung)) {
        results.push({ index: i, title, score: 1, matchType: "chosung" });
        continue;
      }
    }

    // Jamo decomposed contains
    const tDecomposed = decomposeString(tLower);
    if (tDecomposed.includes(qDecomposed)) {
      results.push({ index: i, title, score: 2, matchType: "jamo" });
      continue;
    }

    // Levenshtein distance (only for short queries to avoid noise)
    if (q.length >= 2 && q.length <= 10) {
      const dist = levenshtein(qDecomposed, tDecomposed.slice(0, qDecomposed.length + 5));
      const threshold = Math.max(2, Math.floor(qDecomposed.length * 0.4));
      if (dist <= threshold) {
        results.push({ index: i, title, score: 3 + dist, matchType: "levenshtein" });
      }
    }
  }

  return results.sort((a, b) => a.score - b.score).slice(0, maxResults);
}
