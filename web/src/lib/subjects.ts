export const SUBJECT_ORDER = [
  "부동산학개론",
  "민법및민사특별법",
  "공인중개사법령및중개실무",
  "부동산공법",
  "부동산공시법",
  "부동산세법",
] as const;

export const SUBJECT_LABELS: Record<string, string> = {
  부동산학개론: "부동산학개론",
  민법및민사특별법: "민법 및 민사특별법",
  공인중개사법령및중개실무: "공인중개사법령 및 중개실무",
  부동산공법: "부동산공법",
  부동산공시법: "부동산공시법",
  부동산세법: "부동산세법",
};

export const EXAM_LABELS: Record<string, string> = {
  부동산학개론: "1차",
  민법및민사특별법: "1차",
  공인중개사법령및중개실무: "2차",
  부동산공법: "2차",
  부동산공시법: "2차",
  부동산세법: "2차",
};

export const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; header: string }> = {
  부동산학개론:            { bg: "bg-blue-50",    text: "text-blue-800",    border: "border-blue-200",    header: "bg-blue-800" },
  민법및민사특별법:        { bg: "bg-pink-50",    text: "text-pink-800",    border: "border-pink-200",    header: "bg-pink-800" },
  공인중개사법령및중개실무: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", header: "bg-emerald-800" },
  부동산공법:              { bg: "bg-amber-50",   text: "text-amber-800",   border: "border-amber-200",   header: "bg-amber-800" },
  부동산공시법:            { bg: "bg-indigo-50",  text: "text-indigo-800",  border: "border-indigo-200",  header: "bg-indigo-800" },
  부동산세법:              { bg: "bg-red-50",     text: "text-red-800",     border: "border-red-200",     header: "bg-red-800" },
};

export function getSubjectColor(subject: string) {
  return SUBJECT_COLORS[subject] || { bg: "bg-gray-50", text: "text-gray-800", border: "border-gray-200", header: "bg-gray-800" };
}
