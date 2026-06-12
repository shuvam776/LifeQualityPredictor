import { connectDB } from "@/config/dbConfig";
import City from "@/models/City";
import { getAQI } from "@/services/aqi.service";

export async function GET() {
  await connectDB();

  const cities = await City.find();

  for (const city of cities) {
    try {
      const data = await getAQI(
        city.name,
        city.state,
        city.country
      );

      const current =
        data.data.current;

      city.aqi =
        current.pollution.aqius;

      city.temperature =
        current.weather.tp;

      city.humidity =
        current.weather.hu;

      city.pressure =
        current.weather.pr;

      city.wind_speed =
        current.weather.ws;

      city.wind_direction =
        current.weather.wd;

      city.heat_index =
        current.weather.heatIndex;

      await city.save();
    } catch (err) {
      console.error(err);
    }
  }

  return Response.json({
    success: true,
    data : City
  });
}