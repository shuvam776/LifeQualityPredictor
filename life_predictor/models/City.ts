import mongoose, { Document, Model } from "mongoose";

export interface ICity extends Document {
  name: string;
  state: string | null;
  country: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  population: number | null;
  population_density: number | null;
  aqi: number | null;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  heat_index: number | null;
  crime_rate: number | null;
  hospital_density: number | null;
  school_density: number | null;
  internet_score: number | null;
  employment_rate: number | null;
  green_cover: number | null;
  cost_of_living: number | null;
  livability_score: number | null;
  climate_zone: string | null;
  development_tier: string | null;
}

const CitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    state: { type: String, default: null },
    country: { type: String, default: null },
    district: { type: String, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    population: { type: Number, default: null },
    population_density: { type: Number, default: null },
    aqi: { type: Number, default: null },
    temperature: { type: Number, default: null },
    humidity: { type: Number, default: null },
    pressure: { type: Number, default: null },
    wind_speed: { type: Number, default: null },
    wind_direction: { type: Number, default: null },
    heat_index: { type: Number, default: null },
    crime_rate: { type: Number, default: null },
    hospital_density: { type: Number, default: null },
    school_density: { type: Number, default: null },
    internet_score: { type: Number, default: null },
    employment_rate: { type: Number, default: null },
    green_cover: { type: Number, default: null },
    cost_of_living: { type: Number, default: null },
    livability_score: { type: Number, default: null },
    climate_zone: { type: String, default: null },
    development_tier: { type: String, default: null },
  },
  { timestamps: true }
);

const City: Model<ICity> = mongoose.models.City || mongoose.model<ICity>("City", CitySchema);
export default City;