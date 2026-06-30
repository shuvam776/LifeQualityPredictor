import { NextResponse } from "next/server";
import { connectDB } from "@/config/dbConfig";
import City from "@/models/City";
import { cities as defaultCities, citySeedMap } from "@/services/city.service";
import { getAQI } from "@/services/aqi.service";
import { getWeather } from "@/services/weather.service";
import { getPopulation } from "@/services/population.service";
import { getHospitalDensity } from "@/services/hospital.service";
import { getCrimeFromCSV, getSchoolsFromCSV } from "@/services/csv.service";
import { getEmploymentRate } from "@/services/jobs.service";
import { getInternetScore } from "@/services/internet.service";
import { getCostOfLiving } from "@/services/costOfLiving.service";
import { calculateLivability } from "@/lib/calculateLivability";
import fs from "fs";
import path from "path";


const sleep = async (ms: number) => {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if ((global as any).abortIngestion) {
      throw new Error("ABORT_PIPELINE");
    }
    await new Promise((r) => setTimeout(r, 100));
  }
};


async function safeSave(city: any) {
  if ((global as any).abortIngestion) {
    throw new Error("ABORT_PIPELINE");
  }
  const exists = await City.exists({ _id: city._id });
  if (!exists) {
    throw new Error("ABORT_PIPELINE");
  }
  await city.save();
}


export async function GET(request: Request) {
  const log: string[] = [];
  const nullFields: string[] = [];

  try {
    (global as any).abortIngestion = false;
    await connectDB();

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const count = await City.countDocuments();
    if (count > 0 && !force) {
      return NextResponse.json({
        success: true,
        message: "Database already populated. Skipping API calls. Use ?force=true to force re-ingest.",
        citiesProcessed: count,
      });
    }


    log.push("Seeding cities with dataset baseline parameters...");
    const datasetPath = path.join(process.cwd(), "..", "backend", "dataset.csv");
    const baselineMap = new Map<string, any>();
    if (fs.existsSync(datasetPath)) {
      try {
        const fileContent = fs.readFileSync(datasetPath, "utf-8");
        const lines = fileContent.split(/\r?\n/);
        if (lines.length > 0) {
          const headers = lines[0].split(",").map(h => h.trim());
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols = line.split(",").map(c => c.trim());
            const row: any = {};
            headers.forEach((header, index) => {
              const val = cols[index];
              row[header] = (val === undefined || val === "") ? null : val;
            });
            if (row.city) {
              baselineMap.set(row.city.toLowerCase(), row);
            }
          }
          log.push(`Loaded ${baselineMap.size} cities from baseline dataset.csv.`);
        }
      } catch (err: any) {
        log.push(`Warning: could not read baseline dataset.csv: ${err.message}`);
      }
    } else {
      log.push("Warning: baseline dataset.csv not found.");
    }

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

    for (const c of defaultCities) {
      const match = baselineMap.get(c.city.toLowerCase());
      const baseline: any = {};
      const normalizedCityName = c.city.toLowerCase();
      baseline.climate_zone = match && match.climate_zone ? match.climate_zone : (climateMap[normalizedCityName] || "Temperate");
      baseline.development_tier = match && match.development_tier ? match.development_tier : (tierMap[normalizedCityName] || "Tier 2");

      if (match) {
        baseline.population = match.population !== null ? Number(match.population) : null;
        baseline.population_density = match.population_density !== null ? Number(match.population_density) : null;
        baseline.aqi = match.aqi !== null ? Number(match.aqi) : null;
        baseline.temperature = match.temperature !== null ? Number(match.temperature) : null;
        baseline.humidity = match.humidity !== null ? Number(match.humidity) : null;
        baseline.crime_rate = match.crime_rate !== null ? Number(match.crime_rate) : null;
        baseline.hospital_density = match.hospital_density !== null ? Number(match.hospital_density) : null;
        baseline.school_density = match.school_density !== null ? Number(match.school_density) : null;
        baseline.internet_score = match.internet_score !== null ? Number(match.internet_score) : null;
        baseline.employment_rate = match.employment_rate !== null ? Number(match.employment_rate) : null;
        baseline.green_cover = match.green_cover !== null ? Number(match.green_cover) : null;
        baseline.cost_of_living = match.cost_of_living !== null ? Number(match.cost_of_living) : null;
      }

      const doc = await City.findOne({ name: c.city });
      if (!doc) {
        await City.create({
          name: c.city,
          state: c.state,
          country: c.country,
          district: c.city,
          latitude: c.latitude,
          longitude: c.longitude,
          ...baseline
        });
      } else {
        let modified = false;
        for (const [key, val] of Object.entries(baseline)) {
          if (force || doc[key] === null || doc[key] === undefined) {
            doc[key] = val;
            modified = true;
          }
        }
        if (modified) {
          await doc.save();
        }
      }
    }
    let cities = await City.find();
    log.push(`Seeded/Patched ${cities.length} cities.`);


    log.push("Fetching population (GeoDB)...");
    for (const city of cities) {
      try {
        const result = await getPopulation(city.name);
        if (result) {
          if (!city.state && result.region) city.state = result.region;
          if (!city.country && result.country) city.country = result.country;
          if (!city.latitude && result.latitude) city.latitude = result.latitude;
          if (!city.longitude && result.longitude) city.longitude = result.longitude;
          city.population = result.population ?? city.population;
          city.population_density = result.populationDensity ?? city.population_density;
          console.log(`[pop] ${city.name}: ${result.population}`);
        } else {
          nullFields.push(`${city.name}.population (no match)`);
        }
      } catch (err: any) {
        nullFields.push(`${city.name}.population (${err.message})`);
        console.error(`[pop] ${city.name}: ${err.message}`);
      }
      await safeSave(city);
      await sleep(1200);
    }


    log.push("Fetching AQI + weather (IQAir)...");
    for (const city of cities) {
      try {
        if (!city.state || !city.country) {
          throw new Error("missing state/country for IQAir lookup");
        }
        const json = await getAQI(city.name, city.state, city.country);
        const cur = json.data.current;
        city.aqi = cur.pollution?.aqius ?? city.aqi;
        city.temperature = cur.weather?.tp ?? city.temperature;
        city.humidity = cur.weather?.hu ?? city.humidity;
        city.pressure = cur.weather?.pr ?? city.pressure;
        city.wind_speed = cur.weather?.ws ?? city.wind_speed;
        city.wind_direction = cur.weather?.wd ?? city.wind_direction;
        city.heat_index = cur.weather?.heatIndex ?? city.heat_index;
        console.log(`[aqi] ${city.name}: AQI=${city.aqi} temp=${city.temperature}`);
      } catch (err: any) {
        nullFields.push(`${city.name}.aqi (${err.message})`);
        console.error(`[aqi] ${city.name}: ${err.message}`);
      }
      await safeSave(city);
      await sleep(65000);
    }


    log.push("Fetching weather (Open-Meteo for remaining nulls)...");
    for (const city of cities) {
      if (city.temperature !== null && city.temperature !== undefined) continue;
      if (city.latitude == null || city.longitude == null) continue;
      try {
        const data = await getWeather(city.latitude, city.longitude);
        city.temperature = data?.current?.temperature_2m ?? city.temperature;
        city.humidity = data?.current?.relative_humidity_2m ?? city.humidity;
        if (data?.current?.temperature_2m !== undefined)
          console.log(`[weather] ${city.name}: temp=${city.temperature}`);
        else
          nullFields.push(`${city.name}.temperature (Open-Meteo no data)`);
      } catch (err: any) {
        nullFields.push(`${city.name}.temperature (Open-Meteo: ${err.message})`);
      }
      await safeSave(city);

    }


    log.push("Fetching hospital density (data.gov.in)...");
    for (const city of cities) {
      try {
        const term = city.district || city.name;
        const count = await getHospitalDensity(term);
        if (count > 0) {
          city.hospital_density = count;
          console.log(`[hosp] ${city.name}: ${count}`);
        } else {
          nullFields.push(`${city.name}.hospital_density (count=0)`);
        }
      } catch (err: any) {
        nullFields.push(`${city.name}.hospital_density (${err.message})`);
      }
      await safeSave(city);
      await sleep(500);
    }


    log.push("Loading school density from CSV...");
    for (const city of cities) {
      const count = getSchoolsFromCSV(city.name);
      if (count !== null) city.school_density = count;
      else nullFields.push(`${city.name}.school_density (not in CSV)`);
      await safeSave(city);
    }


    log.push("Loading crime data from CSV...");
    for (const city of cities) {
      const crime = getCrimeFromCSV(city.name);
      if (crime !== null) city.crime_rate = crime;
      else nullFields.push(`${city.name}.crime_rate (not in CSV)`);
      await safeSave(city);
    }


    log.push("Fetching employment rates (JSearch)...");
    for (const city of cities) {
      try {
        const rate = await getEmploymentRate(city.name);
        if (rate !== null && rate !== undefined) {
          city.employment_rate = rate;
          console.log(`[employment] ${city.name}: ${rate}% employment rate`);
        } else {
          nullFields.push(`${city.name}.employment_rate (returned null)`);
        }
      } catch (err: any) {
        nullFields.push(`${city.name}.employment_rate (${err.message})`);
        console.error(`[employment] ${city.name}: ${err.message}`);
      }
      await safeSave(city);
      await sleep(1500);
    }


    log.push("Fetching internet scores (NetConnect)...");
    for (const city of cities) {
      try {
        const score = await getInternetScore(city.name);
        if (score !== null && score !== undefined) {
          city.internet_score = score;
          console.log(`[internet] ${city.name}: Score ${score}`);
        } else {
          nullFields.push(`${city.name}.internet_score (returned null)`);
        }
      } catch (err: any) {
        nullFields.push(`${city.name}.internet_score (${err.message})`);
        console.error(`[internet] ${city.name}: ${err.message}`);
      }
      await safeSave(city);
      await sleep(1000);
    }


    log.push("Fetching cost of living indices (Cost of Living API)...");
    for (const city of cities) {
      try {
        const costIndex = await getCostOfLiving(city.name);
        if (costIndex !== null && costIndex !== undefined) {
          city.cost_of_living = costIndex;
          console.log(`[costIndex] ${city.name}: Index ${costIndex}`);
        } else {
          nullFields.push(`${city.name}.cost_of_living (returned null)`);
        }
      } catch (err: any) {
        nullFields.push(`${city.name}.cost_of_living (${err.message})`);
        console.error(`[costIndex] ${city.name}: ${err.message}`);
      }
      await safeSave(city);
      await sleep(1000);
    }


    log.push("Calculating livability scores...");
    const fresh = await City.find();
    for (const city of fresh) {
      try {
        city.livability_score = calculateLivability(city);
        await safeSave(city);
      } catch (err: any) {
        if (err.message === "ABORT_PIPELINE") throw err;
        nullFields.push(`${city.name}.livability_score (${err.message})`);
      }
    }

    log.push("Ingestion pipeline complete.");
    console.log(`[ingest/all] Done — ${cities.length} cities, ${nullFields.length} null fields`);

    return NextResponse.json({
      success: true,
      log,
      nullFields: nullFields.length ? nullFields : undefined,
      citiesProcessed: cities.length,
    });
  } catch (error: any) {
    if (error.message === "ABORT_PIPELINE") {
      const reason = (global as any).abortIngestion ? "Stop requested by user." : "Database was cleared or seeded during execution.";
      log.push(`Ingestion aborted: ${reason}`);
      console.warn(`[ingest/all] Ingestion aborted: ${reason}`);
      return NextResponse.json(
        { success: false, error: `Ingestion aborted safely: ${reason}`, log },
        { status: 409 }
      );
    }
    console.error("[ingest/all] Fatal:", error);
    return NextResponse.json(
      { success: false, error: error.message || String(error), log },
      { status: 500 }
    );
  }
}
