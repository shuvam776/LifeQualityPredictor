import { SCORING_WEIGHTS }
from "./scoringWeights";

export function calculateLivability(
  city: any
) {
  const score =
    (city.aqi || 0) *
      SCORING_WEIGHTS.aqi +

    (city.hospital_density || 0) *
      SCORING_WEIGHTS.hospital_density +

    (city.school_density || 0) *
      SCORING_WEIGHTS.school_density +

    (city.employment_rate || 0) *
      SCORING_WEIGHTS.employment_rate +

    (city.internet_score || 0) *
      SCORING_WEIGHTS.internet_score +

    (city.green_cover || 0) *
      SCORING_WEIGHTS.green_cover +

    (city.cost_of_living || 0) *
      SCORING_WEIGHTS.cost_of_living +

    (city.crime_rate || 0) *
      SCORING_WEIGHTS.crime_rate +

    (city.population_density || 0) *
      SCORING_WEIGHTS.population_density +

    (city.temperature || 0) *
      SCORING_WEIGHTS.temperature;

  return Math.max(
    0,
    Math.min(
      100,
      Number(score.toFixed(2))
    )
  );
}