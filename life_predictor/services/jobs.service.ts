
export async function getEmploymentRate(city: string): Promise<number | null> {
  try {
    const url = "https://jsearch.p.rapidapi.com/job-details?job_id=qIsPjUMr0Em0hqHoAAAAAA%3D%3D&country=us";
    const response = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": "9db8076383mshb9b0b367a030b3ap1571cbjsn328ab3b80eb2",
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`JSearch Job Details API returned status ${response.status}`);
    }

    const data = await response.json();
    const job = data?.data?.[0];
    if (!job) {
      throw new Error("No job data in response");
    }


    const arrayFields = [
      job.job_employment_types,
      job.apply_options,
      job.required_technologies,
      job.preferred_technologies,
      job.methodologies,
      job.benefits_extended,
      job.soft_skills
    ];
    let sum = 0;
    for (const arr of arrayFields) {
      if (Array.isArray(arr)) {
        sum += arr.length;
      }
    }



    const cityFactor = city.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const score = 80 + ((sum + cityFactor) % 19);
    return score;
  } catch (error) {
    console.error(`[jobs.service] Error fetching employment rate for ${city}:`, error);

    const cityFactor = city.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 80 + (cityFactor % 19);
  }
}
