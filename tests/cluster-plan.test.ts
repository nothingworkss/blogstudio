import { describe, expect, it } from "vitest";
import { clusterPillars, firstTenArticles } from "@/lib/content/cluster-plan";
import { seedProducts } from "@/lib/data/seed";
import { selectProductsByScore } from "@/lib/ai/selectProducts";
import type { BlogDraftInput } from "@/types/blog";

describe("airport cluster plan", () => {
  it("keeps one distinct focus keyword per planned article and covers the 30 search topics", () => {
    const allKeywords = clusterPillars.flatMap((pillar) => [pillar.keyword, ...pillar.relatedKeywords]);
    expect(clusterPillars).toHaveLength(4);
    expect(firstTenArticles).toHaveLength(10);
    expect(new Set([...clusterPillars, ...firstTenArticles].map((article) => article.keyword)).size).toBe(14);
    expect(allKeywords).toHaveLength(34);
    expect(firstTenArticles.every((article) => allKeywords.includes(article.keyword))).toBe(true);
  });

  it.each(firstTenArticles)("uses the assigned lead product for $keyword", (article) => {
    const input: BlogDraftInput = {
      topic: article.title,
      main_keyword: article.keyword,
      sub_keywords: [],
      target_reader: "",
      situation: "",
      raw_memo: article.note,
      post_type: article.postType,
      reference_style: "검색 유입 정보형",
      preferred_products: [article.primaryProduct],
      product_detail_answers: {},
      cta: "",
      images: [],
    };
    expect(seedProducts.some((product) => product.name === article.primaryProduct)).toBe(true);
    expect(selectProductsByScore({ input, products: seedProducts })[0]?.product.name).toBe(article.primaryProduct);
  });
});
