import { NextResponse } from "next/server";
import { connectDB } from "@/config/dbConfig";
import City from "@/models/City";
import { getAQI } from "@/services/aqi.service";

export async function GET() {
  try {
    await connectDB();

    const cities = await City.find();

    for (const city of cities) {
      try {
        if (!city.name || !city.state || !city.country) {
          console.warn(`Skipping ${city.name}: missing state or country`);
          continue;
        }

        const apiResponse = await getAQI(city.name, city.state, city.country);

        if (
          apiResponse &&
          apiResponse.status === "success" &&
          apiResponse.data?.current
        ) {
          const currentData = apiResponse.data.current;

          city.aqi = currentData.pollution?.aqius ?? 0;
          city.temperature = currentData.weather?.tp ?? 0;
          city.humidity = currentData.weather?.hu ?? 0;
          city.pressure = currentData.weather?.pr ?? 0;
          city.wind_speed = currentData.weather?.ws ?? 0;
          city.wind_direction = currentData.weather?.wd ?? 0;
          city.heat_index = currentData.weather?.heatIndex ?? 0;

          await city.save();
          console.log(`[ingest/aqi] Saved AQI & weather for ${city.name}`);
        } else {
          console.warn(
            `[ingest/aqi] No data for ${city.name}:`,
            apiResponse?.status
          );
        }
      } catch (err: any) {
        console.error(`[ingest/aqi] Error for ${city.name}:`, err.message || err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "AQI and weather data successfully stored in MongoDB",
    });
  } catch (error: any) {
    console.error("[ingest/aqi] Route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || error },
      { status: 500 }
    );
  }
}