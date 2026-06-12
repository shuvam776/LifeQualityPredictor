import { NextResponse } from "next/server";
import { getPopulation } from "@/services/population.service";
import { connectDB } from "@/config/dbConfig";
import City from "@/models/City";

export async function GET() {
  try {
    await connectDB();
    const cities = await City.find();

    for (const city of cities) {
      try {
        if (!city.name) continue;

        // getPopulation already returns data.data[0] (the first city match)
        const result = await getPopulation(city.name);

        if (result) {
          // Update state, country and coordinates if not already set
          if (!city.state && result.region) city.state = result.region;
          if (!city.country && result.country) city.country = result.country;
          if (!city.latitude && result.latitude) city.latitude = result.latitude;
          if (!city.longitude && result.longitude) city.longitude = result.longitude;

          city.population = result.population ?? 0;
          city.population_density = result.populationDensity ?? 0;

          await city.save();
          console.log(
            `[ingest/population] ${city.name}: pop=${result.population}`
          );
        }
      } catch (err: any) {
        console.error(
          `[ingest/population] Error for ${city.name}:`,
          err.message || err
        );
      }
    }

    return NextResponse.json({
      message: "Population data updated successfully",
      success: true,
    });
  } catch (err: any) {
    console.error("[ingest/population] Route error:", err);
    return NextResponse.json(
      { message: "Error", success: false, error: err.message || err },
      { status: 500 }
    );
  }
}