/**
 * Fetches hospital count for a given district from data.gov.in
 * Returns the number of hospitals in that district as a numeric density.
 */
export async function getHospitalDensity(district: string): Promise<number> {
  try {
    const encodedDistrict = encodeURIComponent(district);
    const url =
      `https://api.data.gov.in/resource/98fa254e-c5f8-4910-a19b-4828939b477d` +
      `?api-key=${process.env.DATA_GOV_API_KEY}` +
      `&format=json` +
      `&limit=5000` +
      `&filters[district]=${encodedDistrict}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Hospital API responded with status ${response.status}`);
    }
    const data = await response.json();

    // data.count is the number of hospitals in that district
    const count = Number(data.count ?? data.total ?? 0);
    return isNaN(count) ? 0 : count;
  } catch (error) {
    console.error(`[hospital.service] Error fetching hospitals for "${district}":`, error);
    return 0;
  }
}