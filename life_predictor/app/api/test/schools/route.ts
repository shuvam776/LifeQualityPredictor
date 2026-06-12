import { getSchools } from "@/services/school.service";

export async function GET() {
  const data = await getSchools("Kolkata");

  return Response.json(data);
}