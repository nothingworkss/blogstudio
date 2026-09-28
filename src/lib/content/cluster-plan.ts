import type { PostType } from "@/types/blog";

export type ArticleBrief = {
  id: string;
  cluster: string;
  title: string;
  keyword: string;
  relatedKeywords: string[];
  primaryProduct: string;
  postType: PostType;
  note: string;
};

export const clusterPillars: ArticleBrief[] = [
  {
    id: "pillar-gimpo", cluster: "김포공항", title: "김포공항 선물·기념품 가이드｜여행 전 들르기 좋은 쿠키 픽업",
    keyword: "김포공항 선물·기념품 가이드", relatedKeywords: ["김포공항 선물", "김포공항 기념품", "김포공항 디저트", "김포공항 쿠키", "김포공항 근처 선물", "김포공항 간식", "김포공항 맛집 디저트", "김포공항 픽업", "김포공항 국내선 선물", "제주여행 선물", "여행 선물 추천", "서울 기념품 쿠키"],
    primaryProduct: "쿠키플라이트 (COOKIE FLIGHT)", postType: "클러스터 대장 글",
    note: "김포공항 밖 공항동 작업실에서 예약 픽업하는 방법을 정확히 설명한다. 기념품·디저트·단품 쿠키·픽업은 각각 연결 글의 주제로 안내하고, 발행된 글의 실제 URL만 연결한다.",
  },
  {
    id: "pillar-magok", cluster: "마곡·송정", title: "마곡·송정역 쿠키와 답례품｜공항동 수제쿠키 픽업",
    keyword: "마곡·송정역 쿠키와 답례품", relatedKeywords: ["마곡 답례품", "마곡 쿠키", "마곡 디저트", "마곡 선물", "송정역 디저트", "공항동 디저트"],
    primaryProduct: "터미널쿠키 (terminal 샌드쿠키)", postType: "클러스터 대장 글",
    note: "회사·단체 주문과 답례품 선택 기준을 중심으로 설명한다. 마곡 안에 매장이 있다고 쓰지 말고 공항동 예약 픽업과 상담 가능한 주문을 구분한다.",
  },
  {
    id: "pillar-flight", cluster: "비행기·여행·승무원", title: "비행기 쿠키를 만드는 이유｜여행과 공항을 담은 NOTHINGMATTERS",
    keyword: "비행기 쿠키를 만드는 이유", relatedKeywords: ["비행기 쿠키", "비행기 모양 쿠키", "승무원 선물", "승무원 간식", "여행 간식 추천", "공항 선물"],
    primaryProduct: "SNS쿠키 (비행기 버터쿠키)", postType: "브랜드 스토리형",
    note: "공항동 작업실, 쿠키플라이트 4종 세트, 비행기 버터쿠키 단품, 터미널쿠키의 선물 무드를 실제 공개 정보로 연결한다. 창업 동기나 제작 일화를 지어내지 않는다.",
  },
  {
    id: "pillar-favor", cluster: "답례품", title: "쿠키 답례품 고르는 법｜결혼식·회사·어린이집 상황별 정리",
    keyword: "쿠키 답례품 고르는 법", relatedKeywords: ["쿠키 답례품", "회사 답례품", "기업 답례품", "결혼식 답례품 쿠키", "어린이집 답례품", "소량 답례품"],
    primaryProduct: "터미널쿠키 (terminal 샌드쿠키)", postType: "클러스터 대장 글",
    note: "행사별 수량·포장·일정 확인 기준을 정리하고 브라우니쿠키도 비교한다. 터미널쿠키의 소량 가능 여부는 상담 확인 사항으로 둔다.",
  },
];

const firstTenRows: [number, string, string, string, string, PostType, string][] = [
  [1, "김포공항", "김포공항 가기 전, 작은 선물을 찾는다면 비행기 쿠키 어때요?", "김포공항 선물", "쿠키플라이트 (COOKIE FLIGHT)", "클러스터 연결 글", "4개입 선물세트를 중심으로. 김포공항 대장 글과 연결."],
  [2, "김포공항", "김포공항에도 기념품이 있으면 좋겠다고 생각했습니다", "김포공항 기념품", "쿠키플라이트 (COOKIE FLIGHT)", "클러스터 연결 글", "기념품 관점에서 4종 패키지를 소개. 실제 창업 동기처럼 단정하지 않기."],
  [3, "김포공항", "김포공항 근처 조금 특별한 디저트, 터미널쿠키", "김포공항 디저트", "터미널쿠키 (terminal 샌드쿠키)", "클러스터 연결 글", "터미널은 상담형 선물 라인. 고정 맛·가격을 만들지 않기."],
  [4, "비행기·여행·승무원", "진짜 비행기를 쿠키로 만들었습니다", "비행기 쿠키", "SNS쿠키 (비행기 버터쿠키)", "클러스터 연결 글", "비행기 버터쿠키 단품의 모양과 개별 포장에 집중."],
  [5, "비행기·여행·승무원", "승무원에게 주기 좋은 작은 선물, 비행기 쿠키", "승무원 선물", "SNS쿠키 (비행기 버터쿠키)", "클러스터 연결 글", "전달 가능 여부나 기내 반입 조건을 단정하지 않기."],
  [6, "김포공항", "김포공항 가기 전 쿠키 픽업하는 방법", "김포공항 픽업", "쿠키플라이트 (COOKIE FLIGHT)", "지역 픽업 안내형", "공항동 서울 강서구 송정로 25 1층. 예약 확정 후 픽업 일정을 확인하도록 안내."],
  [7, "마곡·송정", "마곡 회사 답례품, 흔한 쿠키 말고 이런 건 어때요?", "마곡 답례품", "터미널쿠키 (terminal 샌드쿠키)", "클러스터 연결 글", "회사 행사 목적·수량·무드 상담 중심."],
  [8, "마곡·송정", "공항동 골목에서 비행기 쿠키를 만들고 있습니다", "공항동 디저트", "SNS쿠키 (비행기 버터쿠키)", "지역 픽업 안내형", "공항동 작업실과 예약 픽업 사실을 중심으로. 현장 즉시 구매를 보장하지 않기."],
  [9, "답례품", "쿠키 답례품 고를 때 맛보다 먼저 확인할 것", "쿠키 답례품", "터미널쿠키 (terminal 샌드쿠키)", "클러스터 연결 글", "행사·수량·전달 방식의 기준과 브라우니쿠키 비교. 대장 글과 의도가 겹치지 않게 체크리스트에 집중."],
  [10, "김포공항", "제주 가는 날, 김포공항에서부터 여행 기분 내기", "제주여행 선물", "쿠키플라이트 (COOKIE FLIGHT)", "클러스터 연결 글", "제주말차가 포함된 4종 쿠키와 예약 픽업을 설명."],
];

export const firstTenArticles: ArticleBrief[] = firstTenRows.map(([rank, cluster, title, keyword, primaryProduct, postType, note]) => ({
  id: `priority-${rank}`,
  cluster,
  title,
  keyword,
  relatedKeywords: [],
  primaryProduct,
  postType,
  note,
}));

export const articleBriefs = [...clusterPillars, ...firstTenArticles];
