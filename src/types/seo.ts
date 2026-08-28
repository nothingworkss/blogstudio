export type SeoKeywordResult = {
  main_keyword: string;
  related_titles: string[];
  recurring_keywords: string[];
  title_patterns: string[];
  risky_expressions: string[];
  source: "naver" | "fallback";
};

export type SeoCheck = {
  keyword_count: number;
  body_length: number;
  ad_smell_score: number;
  warnings: string[];
};
