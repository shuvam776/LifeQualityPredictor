import mongoose from "mongoose";

const CitySchema = new mongoose.Schema(
  {
    // Identity
    name: {
      type: String,
      required: true,
      unique: true,
    },
    state:    { type: String, default: null },
    country:  { type: String, default: null },
    district: { type: String, default: null },

    // Location
    latitude:  { type: Number, default: null },
    longitude: { type: Number, default: null },

    // Population
    population:         { type: Number, default: null },
    population_density: { type: Number, default: null },

    // Air Quality + Weather
    aqi:           { type: Number, default: null },
    temperature:   { type: Number, default: null },
    humidity:      { type: Number, default: null },
    pressure:      { type: Number, default: null },
    wind_speed:    { type: Number, default: null },
    wind_direction:{ type: Number, default: null },
    heat_index:    { type: Number, default: null },

    // Livability Features
    crime_rate:      { type: Number, default: null },
    hospital_density:{ type: Number, default: null },
    doctor_count:    { type: Number, default: null },
    hospital_beds:   { type: Number, default: null },
    school_density:  { type: Number, default: null },
    internet_score:  { type: Number, default: null },
    employment_rate: { type: Number, default: null },
    green_cover:     { type: Number, default: null },
    cost_of_living:  { type: Number, default: null },

    // Final Score
    livability_score: { type: Number, default: null },
  },
  { timestamps: true }
);

const City =
  mongoose.models.City || mongoose.model("City", CitySchema);

export default City;