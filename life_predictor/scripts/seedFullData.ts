import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import "@/config/envConfig";
import City from "@/models/City";
import { cities as seedCities } from "@/services/city.service";
import { getCrimeFromCSV, getSchoolsFromCSV } from "@/services/csv.service";
import { getPopulation } from "@/services/population.service";
import { getHospitalDensity } from "@/services/hospital.service";
import { getEmploymentRate } from "@/services/jobs.service";
import { getInternetScore } from "@/services/internet.service";
import { getCostOfLiving } from "@/services/costOfLiving.service";
import { getWeather } from "@/services/weather.service";
import { getAQI } from "@/services/aqi.service";
import { calculateLivability } from "@/lib/calculateLivability";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function seedFullData() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI!);

  console.log("Clearing database...");
  await City.deleteMany({});

  const now = new Date();
  const preparedCities = [];

  console.log("Fetching real attributes for cities (APIs + CSVs)...");
  for (const c of seedCities) {
    console.log(`Processing city: ${c.city}...`);
    
    // 1. Fetch from local CSVs (fast)
    const crime = getCrimeFromCSV(c.city);
    const schools = getSchoolsFromCSV(c.city);

    // 2. Fetch Weather (Open-Meteo: unlimited, fast)
    let temp: number | null = null;
    let humid: number | null = null;
    try {
      const weather = await getWeather(c.latitude, c.longitude);
      temp = weather?.current?.temperature_2m ?? null;
      humid = weather?.current?.relative_humidity_2m ?? null;
    } catch (e: any) {
      console.warn(`[weather] Could not fetch weather for ${c.city}: ${e.message}`);
    }

    // 3. Fetch Population (GeoDB: 1.2s delay if successful, null on error/limit)
    let pop: number | null = null;
    let popDensity: number | null = null;
    try {
      const result = await getPopulation(c.city);
      if (result) {
        pop = result.population ?? null;
        popDensity = result.populationDensity ?? null;
      }
      await sleep(1000); // 1 sec delay to respect rate limit
    } catch (e: any) {
      console.warn(`[pop] Could not fetch population for ${c.city}: ${e.message}`);
    }

    // 4. Fetch Hospital Density (data.gov.in)
    let hospitalDensity: number | null = null;
    try {
      const count = await getHospitalDensity(c.city);
      hospitalDensity = count > 0 ? count : null;
      await sleep(500);
    } catch (e: any) {
      console.warn(`[hosp] Could not fetch hospital density for ${c.city}: ${e.message}`);
    }

    // 5. Fetch Employment Rate (JSearch)
    let employmentRate: number | null = null;
    try {
      employmentRate = await getEmploymentRate(c.city);
      await sleep(500);
    } catch (e: any) {
      console.warn(`[jobs] Could not fetch employment rate for ${c.city}: ${e.message}`);
    }
 
    // 6. Fetch AQI (IQAir: skip sleep on fail/rate limit)
    let aqiVal: number | null = null;
    try {
      const aqiRes = await getAQI(c.city, c.state, c.country);
      aqiVal = aqiRes.data.current.pollution?.aqius ?? null;
      await sleep(1000); // Small sleep, if it rate-limits we just catch it next loop
    } catch (e: any) {
      console.warn(`[aqi] Could not fetch AQI for ${c.city}: ${e.message}`);
    }
 
    // Cost of Living (Cost of Living API)
    let costOfLiving: number | null = null;
    try {
      costOfLiving = await getCostOfLiving(c.city);
      await sleep(500);
    } catch (e: any) {
      console.warn(`[cost] Could not fetch cost of living for ${c.city}: ${e.message}`);
    }

    // Internet Score (NetConnect API)
    let internetScore: number | null = null;
    try {
      internetScore = await getInternetScore(c.city);
      await sleep(500);
    } catch (e: any) {
      console.warn(`[internet] Could not fetch internet score for ${c.city}: ${e.message}`);
    }

    const greenCover: number | null = null;

    const climateMap: Record<string, string> = {
      "kolkata": "Tropical",
      "delhi": "Temperate",
      "mumbai": "Tropical",
      "bangalore": "Temperate",
      "chennai": "Tropical",
      "hyderabad": "Tropical",
      "pune": "Temperate",
      "ahmedabad": "Arid",
      "jaipur": "Arid",
      "lucknow": "Temperate",
      "bhopal": "Temperate",
      "indore": "Temperate",
      "patna": "Temperate",
      "chandigarh": "Temperate",
      "kochi": "Tropical",
      "visakhapatnam": "Tropical",
      "surat": "Arid",
      "nagpur": "Temperate",
      "bhubaneswar": "Tropical",
      "bengluru": "Temperate",
      "bengaluru": "Temperate",
      "mysuru": "Temperate"
    };

    const tierMap: Record<string, string> = {
      "kolkata": "Tier 1",
      "delhi": "Tier 1",
      "mumbai": "Tier 1",
      "bangalore": "Tier 1",
      "chennai": "Tier 1",
      "hyderabad": "Tier 1",
      "pune": "Tier 1",
      "ahmedabad": "Tier 1",
      "jaipur": "Tier 2",
      "lucknow": "Tier 2",
      "bhopal": "Tier 2",
      "indore": "Tier 2",
      "patna": "Tier 2",
      "chandigarh": "Tier 2",
      "kochi": "Tier 2",
      "visakhapatnam": "Tier 2",
      "surat": "Tier 2",
      "nagpur": "Tier 2",
      "bhubaneswar": "Tier 2",
      "bengluru": "Tier 1",
      "bengaluru": "Tier 1",
      "mysuru": "Tier 2"
    };

    const normalizedCityName = c.city.toLowerCase();
    const climateZone = climateMap[normalizedCityName] || "Temperate";
    const developmentTier = tierMap[normalizedCityName] || "Tier 2";

    const cityDoc: any = {
      name: c.city,
      state: c.state,
      country: c.country,
      district: c.city,
      latitude: c.latitude,
      longitude: c.longitude,
      population: pop,
      population_density: popDensity,
      aqi: aqiVal,
      temperature: temp,
      humidity: humid,
      crime_rate: crime,
      hospital_density: hospitalDensity,
      school_density: schools,
      internet_score: internetScore,
      employment_rate: employmentRate,
      green_cover: greenCover,
      cost_of_living: costOfLiving,
      climate_zone: climateZone,
      development_tier: developmentTier,
      livability_score: 0,
      createdAt: now,
      updatedAt: now
    };

    // Calculate score
    cityDoc.livability_score = calculateLivability(cityDoc);
    preparedCities.push(cityDoc);
  }

  console.log(`Seeding ${preparedCities.length} cities...`);
  for (const cityDoc of preparedCities) {
    await City.findOneAndUpdate({ name: cityDoc.name }, cityDoc, { upsert: true, new: true });
  }
  console.log("Seeding complete!");

  // Export to CSV
  console.log("Exporting database to dataset.csv...");
  const rows = preparedCities.map((city: any) => ({
    city: city.name,
    latitude: city.latitude,
    longitude: city.longitude,
    population: city.population,
    population_density: city.population_density,
    aqi: city.aqi,
    temperature: city.temperature,
    humidity: city.humidity,
    crime_rate: city.crime_rate,
    hospital_density: city.hospital_density,
    school_density: city.school_density,
    internet_score: city.internet_score,
    employment_rate: city.employment_rate,
    green_cover: city.green_cover,
    cost_of_living: city.cost_of_living,
    climate_zone: city.climate_zone,
    development_tier: city.development_tier,
    livability_score: city.livability_score,
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Cities");

  const outputDir = "c:/New folder/Desktop/OPENCODE/SUMM/LifeQualityPredictor/backend/predictor Notebook";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const csvFilePath = path.join(outputDir, "dataset.csv");
  XLSX.writeFile(workbook, csvFilePath, { bookType: "csv" });
  console.log(`dataset.csv exported to ${csvFilePath}`);

  const fallbackCsvPath = path.join("c:/New folder/Desktop/OPENCODE/SUMM/LifeQualityPredictor/backend", "dataset.csv");
  fs.copyFileSync(csvFilePath, fallbackCsvPath);
  console.log(`dataset.csv copied to backend/ folder`);

  process.exit(0);
}

seedFullData().catch((err) => {
  console.error("Error seeding full data:", err);
  process.exit(1);
});
