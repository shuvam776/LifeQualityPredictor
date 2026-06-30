import { GLOBAL_WEIGHTS } from "./scoringWeights";
import { normalizeFeature } from "./normalizeFeatures";

export function calculateLivability(city: any): number {
  let score = 0;

  for (const [feature, weight] of Object.entries(GLOBAL_WEIGHTS)) {
    const rawValue = city[feature];
    const normalized = normalizeFeature(feature, rawValue);
    score += weight * normalized;
  }

  return Number(score.toFixed(2));
}