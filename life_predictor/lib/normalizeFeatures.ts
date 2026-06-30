import { BOUNDS } from "./scoringWeights";


export function normalizePositive(val: number, min: number, max: number): number {
  if (val <= min) return 0;
  if (val >= max) return 100;
  return ((val - min) / (max - min)) * 100;
}


export function normalizeNegative(val: number, min: number, max: number): number {
  if (val <= min) return 100;
  if (val >= max) return 0;
  return ((max - val) / (max - min)) * 100;
}


export function normalizeGaussian(val: number, mean: number, stdDev: number): number {
  const exponent = -Math.pow(val - mean, 2) / (2 * Math.pow(stdDev, 2));
  return 100 * Math.exp(exponent);
}


export function normalizeFeature(name: string, val: number | null | undefined): number {
  const cleanVal = val ?? 0;


  if (name === "temperature") {
    return normalizeGaussian(cleanVal, 23, 5);
  }
  if (name === "humidity") {
    return normalizeGaussian(cleanVal, 55, 15);
  }


  const bounds = BOUNDS[name];
  if (!bounds) return 0;


  const negativeFeatures = ["aqi", "crime_rate", "cost_of_living", "population_density"];

  if (negativeFeatures.includes(name)) {
    return normalizeNegative(cleanVal, bounds.min, bounds.max);
  } else {
    return normalizePositive(cleanVal, bounds.min, bounds.max);
  }
}
