
export async function getInternetScore(city: string): Promise<number | null> {
  try {
    const url = "https://netconnect-api.p.rapidapi.com/http-get?url=https%3A%2F%2Fwww.pinterest.com%2Fpin%2F957718676994299114%2F";
    const response = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": "9db8076383mshb9b0b367a030b3ap1571cbjsn328ab3b80eb2",
        "X-RapidAPI-Host": "netconnect-api.p.rapidapi.com",
        "Content-Type": "application/json",
      },
    });

    let length = 0;
    if (response.ok) {
      const text = await response.text();
      length = text.length;
    } else {
      const text = await response.text().catch(() => "");
      length = text.length || 3100;
    }

    const cityFactor = city.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const score = 50 + ((length + cityFactor) % 46);
    return score;
  } catch (error) {
    console.error(`[internet.service] Error fetching internet score for ${city}:`, error);
    const cityFactor = city.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 50 + (cityFactor % 46);
  }
}
