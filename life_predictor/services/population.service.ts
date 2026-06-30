
export async function getPopulation(city: string) {
  const url = new URL(
    "https://wft-geo-db.p.rapidapi.com/v1/geo/cities"
  );
  url.searchParams.set("namePrefix", city);
  url.searchParams.set("countryIds", "IN");
  url.searchParams.set("types", "CITY");
  url.searchParams.set("sort", "-population");
  url.searchParams.set("limit", "5");

  const response = await fetch(url.toString(), {
    headers: {
      "X-RapidAPI-Key":  process.env.RAPID_API_KEY!,
      "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Population API ${response.status}: ${body}`);
  }

  const data = await response.json();
  const results: any[] = data?.data ?? [];

  if (results.length === 0) return null;


  const exactMatch = results.find(
    (r) => r.city?.toLowerCase() === city.toLowerCase() ||
           r.name?.toLowerCase() === city.toLowerCase()
  );

  return exactMatch ?? results[0];
}