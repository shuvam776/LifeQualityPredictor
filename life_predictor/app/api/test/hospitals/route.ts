import { connectDB } from "@/config/dbConfig";
import City from "@/models/City";
import { getHospitalDensity } from "@/services/hospital.service";
import { count } from "console";

export async function GET() {
  await connectDB();

  const cities = await City.find();

  for (const city of cities) {
    try {
      const searchTerm = city.district || city.name;
      const count = await getHospitalDensity(searchTerm);

      city.hospital_density = count; // count is now a number
      await city.save();
    } catch (err) {
      console.error(`[test/hospitals] Error for ${city.name}:`, err);
    }
  }

  return Response.json({
    success: true,
    message :count
  });
}