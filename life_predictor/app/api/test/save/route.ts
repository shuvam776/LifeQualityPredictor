import { connectDB } from "@/config/dbConfig";
import City from "@/models/City";

export async function GET() {
  await connectDB();

  const city = await City.create({
    city: "Kolkata",
    aqi: 98,
    temperature: 31,
    humidity: 75,
  });

  return Response.json(city);
}