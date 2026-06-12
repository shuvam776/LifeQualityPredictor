import { connectDB } from "@/config/dbConfig";
import City from "@/models/City";
import { getPopulation } from "@/services/population.service";

export async function GET() {
  await connectDB();

  const cities = await City.find();

  for (const city of cities) {
    try {
      const data = await getPopulation(
        city.name
      );

      city.state =
        data.region;

      city.country =
        data.country;

      city.latitude =
        data.latitude;

      city.longitude =
        data.longitude;

      city.population =
        data.population;

      await city.save();
    } catch (err) {
      console.error(err);
    }
  }

  return Response.json({
    success: true,
  });
}