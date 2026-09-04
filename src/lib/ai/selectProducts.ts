import type { BlogDraftInput } from "@/types/blog";
import type { ImageObservation } from "@/types/image";
import type { Product, ProductScoreBreakdown } from "@/types/product";
import { includesLoose, normalizeForMatch } from "@/lib/utils/strings";

const seasonKeywords: Record<string, string[]> = {
  어린이날: ["어린이날", "어린이집", "유치원", "학교행사", "친구선물"],
  스승의날: ["스승의날", "스승의 날", "감사선물"],
  어버이날: ["어버이날", "감사선물"],
  크리스마스: ["크리스마스", "시즌선물"],
  퇴사: ["퇴사", "답례품", "응원"],
};

export function selectProductsByScore(params: {
  input: BlogDraftInput;
  products: Product[];
  observations?: ImageObservation[];
  recentProductNames?: string[];
}): ProductScoreBreakdown[] {
  const { input, products, observations = [], recentProductNames = [] } = params;
  const topicMemo = [input.topic, input.main_keyword, input.target_reader, input.situation, input.raw_memo].join(" ");
  const imageText = observations
    .flatMap((observation) => [
      ...observation.visible_products,
      observation.packaging,
      observation.caption,
      ...observation.colors,
    ])
    .join(" ");

  return products
    .filter((product) => product.is_active)
    .map((product) => {
      let score = 0;
      const reasons: string[] = [];

      if (input.preferred_products.some((name) => includesLoose(product.name, name))) {
        score += 50;
        reasons.push("사용자가 강조하고 싶은 제품으로 선택했습니다.");
      }

      if (product.fit_situations.some((situation) => includesLoose(input.topic, situation))) {
        score += 40;
        reasons.push(`${input.topic} 상황과 제품 활용 상황이 맞습니다.`);
      }

      if (product.keywords.some((keyword) => includesLoose(input.main_keyword, keyword))) {
        score += 25;
        reasons.push(`${input.main_keyword} 키워드와 제품 키워드가 연결됩니다.`);
      }

      if (product.strengths.some((strength) => keywordOverlap(input.raw_memo, strength))) {
        score += 20;
        reasons.push("사용자 메모와 제품 강점이 맞습니다.");
      }

      if ([product.name, product.category, ...product.keywords].some((value) => keywordOverlap(imageText, value))) {
        score += 20;
        reasons.push("사진 관찰 결과와 제품명이 연결됩니다.");
      }

      const normalizedTopic = normalizeForMatch(topicMemo);
      for (const [season, related] of Object.entries(seasonKeywords)) {
        if (normalizedTopic.includes(normalizeForMatch(season))) {
          const matched = related.some((item) =>
            product.fit_situations.some((situation) => includesLoose(situation, item)),
          );
          if (matched) {
            score += 15;
            reasons.push(`${season} 시즌 키워드와 맞닿아 있습니다.`);
          }
        }
      }

      if (recentProductNames.some((name) => includesLoose(product.name, name))) {
        score -= 10;
        reasons.push("최근 글에서 자주 사용되어 점수를 낮췄습니다.");
      }

      return { product, score, reasons };
    })
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, "ko"));
}

function keywordOverlap(left: string, right: string) {
  const l = normalizeForMatch(left);
  const r = normalizeForMatch(right);
  if (!l || !r) return false;
  if (l.includes(r) || r.includes(l)) return true;
  return [...r].some((char) => l.includes(char)) && r.length <= 8;
}
