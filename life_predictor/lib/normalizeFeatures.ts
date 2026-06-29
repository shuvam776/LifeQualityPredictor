import { BOUNDS } from "./scoringWeights";

/** Min-Max Normalizer (higher is better) */
export function normalizePositive(val: number, min: number, max: number): number {
  if (val <= min) return 0;
  if (val >= max) return 100;
  return ((val - min) / (max - min)) * 100;
}

/** Inverse Min-Max Normalizer (lower is better) */
export function normalizeNegative(val: number, min: number, max: number): number {
  if (val <= min) return 100;
  if (val >= max) return 0;
  return ((max - val) / (max - min)) * 100;
}

/** Non-linear Gaussian Bell Curve Normalizer (optimal center) */
export function normalizeGaussian(val: number, mean: number, stdDev: number): number {
  const exponent = -Math.pow(val - mean, 2) / (2 * Math.pow(stdDev, 2));
  return 100 * Math.exp(exponent);
}

/** Dispatches raw feature values to appropriate normalizers */
export function normalizeFeature(name: string, val: number | null | undefined): number {
  const cleanVal = val ?? 0;

  // Handle Gaussian climate features
  if (name === "temperature") {
    return normalizeGaussian(cleanVal, 23, 5); // 23°C is optimal
  }
  if (name === "humidity") {
    return normalizeGaussian(cleanVal, 55, 15); // 55% is optimal
  }

  // Retrieve standard bounds
  const bounds = BOUNDS[name];
  if (!bounds) return 0;

  // Categorize variables
  const negativeFeatures = ["aqi", "crime_rate", "cost_of_living", "population_density"];
  
  if (negativeFeatures.includes(name)) {
    return normalizeNegative(cleanVal, bounds.min, bounds.max);
  } else {
    return normalizePositive(cleanVal, bounds.min, bounds.max);
  }
}
