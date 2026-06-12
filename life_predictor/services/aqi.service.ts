/**
 * IQAir API — AQI + current weather for a city.
 *
 * Free plan limit: ~10 calls/minute.
 * Throws on HTTP error so the caller can catch and store null.
 */
export async function getAQI(city: string, state: string, country: string) {
  const url = `https://api.airvisual.com/v2/city?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}&key=${process.env.IQAIR_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AQI API ${response.status}: ${body}`);
  }

  const json = await response.json();

  // IQAir returns HTTP 200 even for errors, with status:"failed"
  if (json.status !== "success") {
    throw new Error(`AQI API returned status="${json.status}" for ${city}`);
  }

  return json;
}