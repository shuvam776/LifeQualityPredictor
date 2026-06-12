import { NextResponse } from "next/server";
import { getWeather } from "@/services/weather.service";
import { connectDB } from "@/config/dbConfig";
import City from "@/models/City";

export async function GET()  {
  try {
    await connectDB();

    const cities = await City.find();

    for (const city of cities) {
      try {
        if (city.latitude !== undefined && city.longitude !== undefined) {
          const data = await getWeather(city.latitude, city.longitude);
          const temperature = data?.current?.temperature_2m || 0;
          const humidity = data?.current?.relative_humidity_2m || 0;

          if (temperature && humidity) {
            console.log(`Weather for ${city.name}: Temp=${temperature}°C, Humidity=${humidity}%`);
          }

          city.temperature = temperature;
          city.humidity = humidity;
          await city.save();
        }
      } catch (err) {
        console.log(`Error for ${city.name}:`, err);
      }
    }

    return NextResponse.json({ message: "Weather updated", success: true });
  } catch (error: any) {
    console.error("Error in weather ingest route:", error);
    return NextResponse.json({ message: "Error updating weather", success: false, error: error.message }, { status: 500 });
  }
}