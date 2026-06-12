import { NextResponse } from "next/server";
import { connectDB } from "@/config/dbConfig";
import City from "@/models/City";
import { cities as defaultCities } from "@/services/city.service";

export async function GET(request: Request) {
  try {
    await connectDB();
    let cities = await City.find();

    if (cities.length === 0) {
      const seeded = defaultCities.map((c) => ({
        name: c.city,
        state: c.state,
        country: c.country,
        district: c.city,
        latitude: c.latitude,
        longitude: c.longitude,
        aqi: 0,
        crime_rate: 0,
        hospital_density: 0,
        doctor_count: 0,
        hospital_beds: 0,
        school_density: 0,
        internet_score: 0,
        employment_rate: 0,
        green_cover: 0,
        cost_of_living: 0,
        population: 0,
        population_density: 0,
        livability_score: 0,
        temperature: 0,
        humidity: 0,
      }));
      await City.insertMany(seeded as any);
      cities = await City.find();
    }

    return NextResponse.json(cities);
  } catch (error: any) {
    console.error("Error in getting cities:", error);
    return NextResponse.json(
      {
        message: "Error in getting cities",
        success: false,
        error: error.message || error,
      },
      { status: 500 }
    );
  }
}