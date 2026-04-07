// Sidebar TOC structure matching textbook chapter organization
// Each subject maps to an ordered list of sections with their wiki page slugs

export interface TocSection {
  label: string;
  slug?: string; // wiki slug (concepts/xxx or laws/xxx) — omit for group headers
  children?: TocSection[];
}

export const TOC: Record<string, TocSection[]> = {
  부동산학개론: [
    {
      label: "PART 1 · 부동산학 총론",
      children: [
        { label: "부동산의 개념과 분류", slug: "concepts/부동산의개념과분류" },
        { label: "부동산의 특성", slug: "concepts/부동산의특성" },
      ],
    },
    {
      label: "PART 2 · 부동산 경제이론",
      children: [
        { label: "수요·공급 이론", slug: "concepts/수요공급이론" },
        { label: "부동산 경기변동", slug: "concepts/부동산경기변동" },
      ],
    },
    {
      label: "PART 3 · 부동산 시장론",
      children: [
        { label: "시장 특성", slug: "concepts/부동산시장특성" },
        { label: "지대이론", slug: "concepts/지대이론", children: [
          { label: "리카도", slug: "concepts/지대이론_리카도" },
          { label: "튀넨", slug: "concepts/지대이론_튀넨" },
          { label: "마르크스", slug: "concepts/지대이론_마르크스" },
          { label: "알론소", slug: "concepts/지대이론_알론소" },
          { label: "마샬", slug: "concepts/지대이론_마샬" },
        ]},
        { label: "도시공간구조이론", slug: "concepts/도시공간구조이론", children: [
          { label: "동심원이론", slug: "concepts/도시공간구조_동심원이론" },
          { label: "선형이론", slug: "concepts/도시공간구조_선형이론" },
          { label: "다핵심이론", slug: "concepts/도시공간구조_다핵심이론" },
        ]},
        { label: "입지이론", slug: "concepts/입지이론", children: [
          { label: "베버", slug: "concepts/입지이론_베버" },
          { label: "뢰쉬", slug: "concepts/입지이론_뢰쉬" },
          { label: "크리스탈러", slug: "concepts/입지이론_크리스탈러" },
          { label: "레일리·컨버스·허프", slug: "concepts/입지이론_레일리컨버스허프" },
          { label: "경제기반분석", slug: "concepts/입지이론_경제기반분석" },
        ]},
      ],
    },
    {
      label: "PART 4 · 부동산 정책론",
      children: [
        { label: "정책 총론", slug: "concepts/부동산정책총론" },
        { label: "토지정책", slug: "concepts/토지정책" },
        { label: "주택정책", slug: "concepts/주택정책" },
        { label: "조세정책", slug: "concepts/조세정책" },
      ],
    },
    {
      label: "PART 5 · 부동산 투자론",
      children: [
        { label: "투자이론", slug: "concepts/부동산투자이론" },
        { label: "포트폴리오 이론", slug: "concepts/포트폴리오이론" },
        { label: "투자분석", slug: "concepts/부동산투자분석", children: [
          { label: "승수·비율법", slug: "concepts/부동산투자분석_승수비율법" },
          { label: "할인법 (NPV/IRR)", slug: "concepts/부동산투자분석_할인법" },
          { label: "현금흐름 추정", slug: "concepts/부동산투자분석_현금흐름추정" },
        ]},
        { label: "화폐의 시간가치", slug: "concepts/화폐의시간가치" },
      ],
    },
    {
      label: "PART 6 · 부동산 금융론",
      children: [
        { label: "금융론 개요", slug: "concepts/부동산금융론", children: [
          { label: "저당대출 상환", slug: "concepts/부동산금융_저당대출상환" },
          { label: "저당 유동화", slug: "concepts/부동산금융_저당유동화" },
          { label: "REITs", slug: "concepts/부동산금융_REITs" },
          { label: "PF·주택연금", slug: "concepts/부동산금융_PF와주택연금" },
        ]},
      ],
    },
    {
      label: "PART 7 · 감정평가론",
      children: [
        { label: "감정평가 이론", slug: "concepts/감정평가이론" },
        { label: "감정평가 3방식", slug: "concepts/감정평가3방식", children: [
          { label: "원가법", slug: "concepts/감정평가_원가법" },
          { label: "거래사례비교법", slug: "concepts/감정평가_거래사례비교법" },
          { label: "수익환원법", slug: "concepts/감정평가_수익환원법" },
        ]},
        { label: "가격공시제도", slug: "concepts/부동산가격공시제도" },
      ],
    },
    {
      label: "PART 8 · 개발·관리론",
      children: [
        { label: "개발·관리·마케팅", slug: "concepts/부동산개발관리" },
      ],
    },
  ],

  민법및민사특별법: [
    {
      label: "PART 1 · 민법 총칙",
      children: [
        { label: "법률행위", slug: "concepts/법률행위" },
        { label: "의사표시", slug: "concepts/의사표시", children: [
          { label: "비진의표시", slug: "concepts/의사표시_비진의표시" },
          { label: "통정허위표시", slug: "concepts/의사표시_통정허위표시" },
          { label: "착오", slug: "concepts/의사표시_착오" },
          { label: "사기·강박", slug: "concepts/의사표시_사기강박" },
        ]},
        { label: "대리", slug: "concepts/대리", children: [
          { label: "임의대리", slug: "concepts/대리_임의대리" },
          { label: "무권대리", slug: "concepts/대리_무권대리" },
          { label: "표현대리", slug: "concepts/대리_표현대리" },
        ]},
        { label: "무효와 취소", slug: "concepts/무효와취소" },
        { label: "조건과 기한", slug: "concepts/조건과기한" },
        { label: "소멸시효", slug: "concepts/소멸시효", children: [
          { label: "중단과 정지", slug: "concepts/소멸시효_중단과정지" },
        ]},
      ],
    },
    {
      label: "PART 2 · 물권법",
      children: [
        { label: "물권변동", slug: "concepts/물권변동" },
        { label: "점유권", slug: "concepts/점유권" },
        { label: "소유권", slug: "concepts/소유권" },
        { label: "공동소유", slug: "concepts/공동소유", children: [
          { label: "공유", slug: "concepts/공동소유_공유" },
          { label: "합유", slug: "concepts/공동소유_합유" },
          { label: "총유", slug: "concepts/공동소유_총유" },
        ]},
        { label: "용익물권", slug: "concepts/용익물권", children: [
          { label: "지상권", slug: "concepts/용익물권_지상권" },
          { label: "지역권", slug: "concepts/용익물권_지역권" },
          { label: "전세권", slug: "concepts/용익물권_전세권" },
        ]},
        { label: "담보물권", slug: "concepts/담보물권", children: [
          { label: "유치권", slug: "concepts/담보물권_유치권" },
          { label: "질권", slug: "concepts/담보물권_질권" },
          { label: "저당권", slug: "concepts/담보물권_저당권" },
        ]},
      ],
    },
    {
      label: "PART 3 · 계약법",
      children: [
        { label: "계약 총론", slug: "concepts/계약총론" },
        { label: "매매", slug: "concepts/매매" },
        { label: "임대차", slug: "concepts/임대차" },
      ],
    },
    {
      label: "PART 4 · 민사특별법",
      children: [
        { label: "주택임대차보호법", slug: "laws/주택임대차보호법" },
        { label: "상가건물임대차보호법", slug: "laws/상가건물임대차보호법" },
        { label: "집합건물법", slug: "laws/집합건물법" },
        { label: "가등기담보법", slug: "laws/가등기담보법" },
        { label: "부동산실명법", slug: "laws/부동산실명법" },
      ],
    },
  ],

  공인중개사법령및중개실무: [
    {
      label: "PART 1 · 공인중개사법",
      children: [
        { label: "총칙·용어 정의", slug: "concepts/용어정의" },
        { label: "중개대상물", slug: "concepts/중개대상물" },
        { label: "정책심의위원회", slug: "concepts/공인중개사정책심의위원회" },
        { label: "시험·자격·교육", slug: "concepts/공인중개사시험" },
        { label: "개설등록·결격사유", slug: "concepts/개설등록과결격사유", children: [
          { label: "개설등록", slug: "concepts/개설등록과결격사유_개설등록" },
          { label: "결격사유", slug: "concepts/개설등록과결격사유_결격사유" },
        ]},
        { label: "중개사무소", slug: "concepts/중개사무소" },
        { label: "의무사항", slug: "concepts/개업공인중개사의의무" },
        { label: "중개계약", slug: "concepts/중개계약" },
        { label: "확인·설명의무", slug: "concepts/확인설명의무", children: [
          { label: "설명사항", slug: "concepts/확인설명의무_설명사항" },
          { label: "확인설명서", slug: "concepts/확인설명의무_확인설명서" },
        ]},
        { label: "거래계약서", slug: "concepts/거래계약서작성" },
        { label: "중개보수", slug: "concepts/중개보수", children: [
          { label: "주택", slug: "concepts/중개보수_주택" },
          { label: "주택 외", slug: "concepts/중개보수_주택외" },
          { label: "산정방법", slug: "concepts/중개보수_산정방법" },
        ]},
        { label: "손해배상책임", slug: "concepts/손해배상책임", children: [
          { label: "보증설정", slug: "concepts/손해배상책임_보증설정" },
          { label: "배상범위", slug: "concepts/손해배상책임_배상책임범위" },
        ]},
        { label: "금지행위", slug: "concepts/금지행위", children: [
          { label: "직접거래·쌍방대리", slug: "concepts/금지행위_직접거래쌍방대리" },
          { label: "기타 금지행위", slug: "concepts/금지행위_기타금지행위" },
        ]},
        { label: "공인중개사협회", slug: "concepts/공인중개사협회" },
        { label: "행정처분", slug: "concepts/행정처분", children: [
          { label: "자격취소", slug: "concepts/행정처분_자격취소" },
          { label: "자격정지", slug: "concepts/행정처분_자격정지" },
          { label: "등록취소", slug: "concepts/행정처분_등록취소" },
          { label: "업무정지", slug: "concepts/행정처분_업무정지" },
        ]},
        { label: "벌칙·과태료", slug: "concepts/벌칙과과태료", children: [
          { label: "벌칙", slug: "concepts/벌칙과과태료_벌칙" },
          { label: "과태료", slug: "concepts/벌칙과과태료_과태료" },
        ]},
      ],
    },
    {
      label: "PART 2 · 부동산거래신고법",
      children: [
        { label: "거래신고 절차", slug: "concepts/부동산거래신고절차" },
        { label: "외국인 취득", slug: "concepts/외국인부동산취득" },
        { label: "토지거래허가", slug: "concepts/토지거래허가" },
      ],
    },
    {
      label: "PART 3 · 중개실무",
      children: [
        { label: "권리분석", slug: "concepts/권리분석" },
        { label: "경매 기초", slug: "concepts/경매기초" },
      ],
    },
    {
      label: "📖 법령 원문",
      children: [
        { label: "공인중개사법", slug: "laws/공인중개사법" },
        { label: "부동산거래신고법", slug: "laws/부동산거래신고법" },
      ],
    },
  ],

  부동산공법: [
    {
      label: "PART 1 · 국토계획법",
      children: [
        { label: "도시계획 체계", slug: "concepts/도시계획체계" },
        { label: "용도지역", slug: "concepts/용도지역", children: [
          { label: "도시지역", slug: "concepts/용도지역_도시지역" },
          { label: "관리지역", slug: "concepts/용도지역_관리지역" },
          { label: "농림지역", slug: "concepts/용도지역_농림지역" },
          { label: "자연환경보전", slug: "concepts/용도지역_자연환경보전지역" },
        ]},
        { label: "용도지구", slug: "concepts/용도지구" },
        { label: "용도구역", slug: "concepts/용도구역" },
        { label: "건폐율·용적률", slug: "concepts/건폐율용적률" },
        { label: "개발행위허가", slug: "concepts/개발행위허가" },
        { label: "도시계획시설", slug: "concepts/도시군계획시설" },
        { label: "지구단위계획", slug: "concepts/지구단위계획" },
      ],
    },
    {
      label: "PART 2 · 도시개발법",
      children: [
        { label: "환지방식", slug: "concepts/환지방식" },
      ],
    },
    {
      label: "PART 3 · 도시정비법",
      children: [
        { label: "조합설립", slug: "concepts/조합설립" },
        { label: "관리처분계획", slug: "concepts/관리처분계획" },
      ],
    },
    {
      label: "PART 4 · 건축법",
      slug: "laws/건축법",
    },
    {
      label: "PART 5 · 주택법",
      slug: "laws/주택법",
    },
    {
      label: "PART 6 · 농지법",
      children: [
        { label: "농지취득자격증명", slug: "concepts/농지취득자격증명" },
        { label: "농업진흥지역", slug: "concepts/농업진흥지역" },
      ],
    },
    {
      label: "PART 7 · 산지관리법",
      slug: "laws/산지관리법",
    },
    {
      label: "📖 법령 원문",
      children: [
        { label: "국토계획법", slug: "laws/국토계획법" },
        { label: "도시개발법", slug: "laws/도시개발법" },
        { label: "도시정비법", slug: "laws/도시정비법" },
        { label: "건축법", slug: "laws/건축법" },
        { label: "주택법", slug: "laws/주택법" },
        { label: "농지법", slug: "laws/농지법" },
        { label: "산지관리법", slug: "laws/산지관리법" },
      ],
    },
  ],

  부동산공시법: [
    {
      label: "PART 1 · 지적 (공간정보관리법)",
      children: [
        { label: "지번", slug: "concepts/지번" },
        { label: "지목 28종", slug: "concepts/지목28종" },
        { label: "경계와 면적", slug: "concepts/경계와면적" },
        { label: "지적공부", slug: "concepts/지적공부" },
        { label: "토지이동", slug: "concepts/토지이동", children: [
          { label: "신규등록", slug: "concepts/토지이동_신규등록" },
          { label: "등록전환", slug: "concepts/토지이동_등록전환" },
          { label: "분할", slug: "concepts/토지이동_분할" },
          { label: "합병", slug: "concepts/토지이동_합병" },
          { label: "지목변경", slug: "concepts/토지이동_지목변경" },
        ]},
        { label: "지적측량", slug: "concepts/지적측량" },
      ],
    },
    {
      label: "PART 2 · 부동산등기법",
      children: [
        { label: "등기소·등기관", slug: "concepts/등기소와등기관" },
        { label: "등기의 효력", slug: "concepts/등기의효력" },
        { label: "등기의 종류", slug: "concepts/등기의종류" },
        { label: "등기부 구조", slug: "concepts/등기부구조" },
        { label: "등기절차", slug: "concepts/등기절차", children: [
          { label: "공동신청", slug: "concepts/등기절차_공동신청" },
          { label: "단독신청", slug: "concepts/등기절차_단독신청" },
          { label: "각하사유", slug: "concepts/등기절차_각하사유" },
        ]},
        { label: "소유권보존등기", slug: "concepts/소유권보존등기" },
        { label: "소유권이전등기", slug: "concepts/소유권이전등기" },
        { label: "가등기", slug: "concepts/가등기" },
        { label: "가처분등기", slug: "concepts/가처분등기" },
        { label: "신탁등기", slug: "concepts/신탁등기" },
        { label: "구분건물등기", slug: "concepts/구분건물등기" },
      ],
    },
    {
      label: "PART 3 · 가격공시법",
      children: [
        { label: "부동산가격공시법", slug: "laws/부동산가격공시법" },
      ],
    },
    {
      label: "📖 법령 원문",
      children: [
        { label: "부동산등기법", slug: "laws/부동산등기법" },
        { label: "공간정보관리법", slug: "laws/공간정보관리법" },
        { label: "부동산가격공시법", slug: "laws/부동산가격공시법" },
      ],
    },
  ],

  부동산세법: [
    {
      label: "PART 1 · 조세총론",
      children: [
        { label: "조세 총론", slug: "concepts/조세총론" },
        { label: "납세의무 성립·확정·소멸", slug: "concepts/납세의무_성립확정소멸" },
      ],
    },
    {
      label: "PART 2 · 지방세",
      children: [
        { label: "취득세", slug: "concepts/취득세", children: [
          { label: "과세표준·세율", slug: "concepts/취득세_과세표준과세율" },
          { label: "중과세", slug: "concepts/취득세_중과세" },
          { label: "신고납부·비과세", slug: "concepts/취득세_신고납부와비과세" },
        ]},
        { label: "등록면허세", slug: "concepts/등록면허세" },
        { label: "재산세", slug: "concepts/재산세", children: [
          { label: "토지분류", slug: "concepts/재산세_토지분류" },
        ]},
      ],
    },
    {
      label: "PART 3 · 국세",
      children: [
        { label: "종합부동산세", slug: "concepts/종합부동산세" },
        { label: "양도소득세", slug: "concepts/양도소득세", children: [
          { label: "과세대상", slug: "concepts/양도소득세_과세대상" },
          { label: "세율", slug: "concepts/양도소득세_세율" },
          { label: "비과세", slug: "concepts/양도소득세_비과세" },
          { label: "계산구조", slug: "concepts/양도소득세_계산구조" },
          { label: "이월과세·부당행위", slug: "concepts/양도소득세_이월과세_부당행위" },
        ]},
      ],
    },
    {
      label: "📊 종합 비교",
      children: [
        { label: "세율 비교표", slug: "concepts/부동산_세율비교" },
        { label: "부가세 관계", slug: "concepts/부동산_부가세" },
      ],
    },
  ],
};
