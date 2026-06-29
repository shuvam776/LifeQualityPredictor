export interface FeatureBounds {
  min: number;
  max: number;
}

export const BOUNDS: Record<string, FeatureBounds> = {
  population:         { min: 100000,    max: 20000000 },
  population_density: { min: 100,      max: 25000 },
  aqi:                { min: 40,        max: 250 },
  crime_rate:         { min: 100,       max: 40000 },
  hospital_density:   { min: 100,       max: 800 },
  school_density:     { min: 50,        max: 1200 },
  internet_score:     { min: 50,        max: 95 },
  employment_rate:    { min: 80,        max: 98 },
  green_cover:        { min: 5,         max: 35 },
  cost_of_living:     { min: 35,        max: 90 },
};

export const GLOBAL_WEIGHTS: Record<string, number> = {
  aqi:                0.175,
  temperature:        0.0875,
  humidity:           0.0525,
  green_cover:        0.035,
  hospital_density:   0.160,
  school_density:     0.120,
  internet_score:     0.110,
  population_density: 0.060,
  crime_rate:         0.100,
  employment_rate:    0.100,
  cost_of_living:     0.100,
};