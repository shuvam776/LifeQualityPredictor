import { getWeather } from "@/services/weather.service";

export async function GET() {
  const data = await getWeather(
    22.5726,
    88.3639
  );

  return Response.json(data);
}