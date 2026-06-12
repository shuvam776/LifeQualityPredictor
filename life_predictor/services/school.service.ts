/**
 * Fetches school count for a given district from data.gov.in
 * Returns the number of schools as a numeric density.
 */
export async function getSchools(district: string): Promise<number> {
  try {
    const encodedDistrict = encodeURIComponent(district);
    // UDISE+ school data from data.gov.in (school directory)
    const url =
      `https://api.data.gov.in/resource/0b25de0a-8cc2-4f3a-a243-a5dc4d9c8c98` +
      `?api-key=${process.env.DATA_GOV_API_KEY}` +
      `&format=json` +
      `&limit=1` +
      `&filters[district_name]=${encodedDistrict}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`School API responded with status ${response.status}`);
    }
    const data = await response.json();

    // Use the total count returned by the API
    const count = Number(data.total ?? data.count ?? 0);
    return isNaN(count) ? 0 : count;
  } catch (error) {
    console.error(`[school.service] Error fetching schools for "${district}":`, error);
    return 0;
  }
}