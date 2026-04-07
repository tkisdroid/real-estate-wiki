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

export const SUBJECT_ICONS: Record<string, string> = {
  부동산학개론: "🏠",
  민법및민사특별법: "⚖️",
  공인중개사법령및중개실무: "📋",
  부동산공법: "🏗️",
  부동산공시법: "📑",
  부동산세법: "💰",
};

export const SUBJECT_COLORS: Record<string, {
  bg: string; text: string; border: string; header: string;
  accent: string; accentBorder: string; gradientFrom: string; gradientTo: string;
}> = {
  부동산학개론:            { bg: "bg-slate-50",    text: "text-slate-700",    border: "border-slate-200",    header: "bg-slate-700",    accent: "bg-slate-100",  accentBorder: "border-l-slate-400",   gradientFrom: "from-slate-500", gradientTo: "to-slate-600" },
  민법및민사특별법:        { bg: "bg-rose-50/80",  text: "text-rose-700",     border: "border-rose-200",     header: "bg-rose-700",     accent: "bg-rose-100",   accentBorder: "border-l-rose-400",    gradientFrom: "from-rose-500",  gradientTo: "to-rose-600" },
  공인중개사법령및중개실무: { bg: "bg-emerald-50/80", text: "text-emerald-700", border: "border-emerald-200", header: "bg-emerald-700", accent: "bg-emerald-100", accentBorder: "border-l-emerald-400", gradientFrom: "from-emerald-500", gradientTo: "to-emerald-600" },
  부동산공법:              { bg: "bg-amber-50/80", text: "text-amber-700",    border: "border-amber-200",    header: "bg-amber-700",    accent: "bg-amber-100",  accentBorder: "border-l-amber-400",   gradientFrom: "from-amber-500", gradientTo: "to-amber-600" },
  부동산공시법:            { bg: "bg-violet-50/80", text: "text-violet-700",  border: "border-violet-200",   header: "bg-violet-700",   accent: "bg-violet-100", accentBorder: "border-l-violet-400",  gradientFrom: "from-violet-500", gradientTo: "to-violet-600" },
  부동산세법:              { bg: "bg-orange-50/80", text: "text-orange-700",  border: "border-orange-200",   header: "bg-orange-700",   accent: "bg-orange-100", accentBorder: "border-l-orange-400",  gradientFrom: "from-orange-500", gradientTo: "to-orange-600" },
};

export function getSubjectColor(subject: string) {
  return SUBJECT_COLORS[subject] || {
    bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", header: "bg-gray-700",
    accent: "bg-gray-100", accentBorder: "border-l-gray-400", gradientFrom: "from-gray-500", gradientTo: "to-gray-600",
  };
}
