import { connectDB } from "@/config/dbConfig";
import City from "@/models/City";

export async function GET() {
  await connectDB();

  const cities = await City.find();

  return Response.json(cities);
}