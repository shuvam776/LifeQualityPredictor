
export async function getCostOfLiving(city: string): Promise<number | null> {
  try {
    const url = "https://cost-of-living-price-index-api.p.rapidapi.com/v1/cheapest-cities?region=world&top=10&category=%7B%7D";
    const response = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": "9db8076383mshb9b0b367a030b3ap1571cbjsn328ab3b80eb2",
        "X-RapidAPI-Host": "cost-of-living-price-index-api.p.rapidapi.com",
        "Content-Type": "application/json",
      },
    });

    let cheapestCities: any[] = [];
    if (response.ok) {
      const data = await response.json();
      cheapestCities = data || [];
    }

    const match = cheapestCities.find(
      (c: any) =>
        c?.city?.toLowerCase() === city.toLowerCase() ||
        c?.name?.toLowerCase() === city.toLowerCase()
    );
    if (match && typeof match.cost_of_living_index === "number") {
      return Math.max(35, Math.min(90, match.cost_of_living_index));
    }

    const cityFactor = city.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 35 + (cityFactor % 56);
  } catch (error) {
    console.error(`[costOfLiving.service] Error fetching cost index for ${city}:`, error);
    const cityFactor = city.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 35 + (cityFactor % 56);
  }
}
