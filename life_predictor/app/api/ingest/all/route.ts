import { NextResponse } from "next/server";
import { connectDB } from "@/config/dbConfig";
import City from "@/models/City";
import { cities as defaultCities, citySeedMap } from "@/services/city.service";
import { getAQI } from "@/services/aqi.service";
import { getWeather } from "@/services/weather.service";
import { getPopulation } from "@/services/population.service";
import { getHospitalDensity } from "@/services/hospital.service";
import { getCrimeFromCSV, getSchoolsFromCSV } from "@/services/csv.service";
import { calculateLivability } from "@/lib/calculateLivability";

/** Wait ms milliseconds — used to respect API rate limits */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * GET /api/ingest/all
 *
 * Master ingestion pipeline — runs on app startup.
 * - No fallback values. API failure → null stored in DB.
 * - Rate limiting: 7s delay between IQAir calls (free plan: ~10/min).
 *   GeoDB has a 1 req/sec limit on free plan — 1.2s delay between calls.
 * - Crime + schools read from local CSVs (no API, no rate limit).
 * - Open-Meteo is unlimited — no delay needed.
 */
export async function GET() {
  const log: string[] = [];
  const nullFields: string[] = [];

  try {
    await connectDB();

    // ── Step 0: Patch missing state/country/lat/lon from seed map ─────────
    const allCities = await City.find();
    let patched = 0;
    for (const city of allCities) {
      const seed = citySeedMap.get(city.name?.toLowerCase());
      if (seed) {
        let changed = false;
        if (!city.state)     { city.state     = seed.state;     changed = true; }
        if (!city.country)   { city.country   = seed.country;   changed = true; }
        if (!city.latitude)  { city.latitude  = seed.latitude;  changed = true; }
        if (!city.longitude) { city.longitude = seed.longitude; changed = true; }
        if (!city.district)  { city.district  = seed.city;      changed = true; }
        if (changed) { await city.save(); patched++; }
      }
    }
    if (patched > 0) log.push(`Patched ${patched} cities with missing metadata.`);

    // ── Step 1: Seed cities if DB is empty ────────────────────────────────
    let cities = await City.find();
    if (cities.length === 0) {
      log.push("Seeding cities...");
      await City.insertMany(
        defaultCities.map((c) => ({
          name: c.city,
          state: c.state,
          country: c.country,
          district: c.city,
          latitude: c.latitude,
          longitude: c.longitude,
        })) as any
      );
      cities = await City.find();
      log.push(`Seeded ${cities.length} cities.`);
    } else {
      log.push(`Found ${cities.length} existing cities in DB.`);
    }

    // ── Step 2: Population via GeoDB (1.2s between calls — 1 req/sec limit) ─
    log.push("Fetching population (GeoDB)...");
    for (const city of cities) {
      try {
        const result = await getPopulation(city.name);
        if (result) {
          if (!city.state    && result.region)    city.state    = result.region;
          if (!city.country  && result.country)   city.country  = result.country;
          if (!city.latitude  && result.latitude)  city.latitude  = result.latitude;
          if (!city.longitude && result.longitude) city.longitude = result.longitude;
          city.population         = result.population         ?? null;
          city.population_density = result.populationDensity  ?? null;
          console.log(`[pop] ${city.name}: ${result.population}`);
        } else {
          city.population = null; city.population_density = null;
          nullFields.push(`${city.name}.population (no match)`);
        }
      } catch (err: any) {
        city.population = null; city.population_density = null;
        nullFields.push(`${city.name}.population (${err.message})`);
        console.error(`[pop] ${city.name}: ${err.message}`);
      }
      await city.save();
      await sleep(1200); // GeoDB free: 1 req/sec
    }

    // ── Step 3: AQI + Weather via IQAir (7s between calls — ~8/min safe) ─
    log.push("Fetching AQI + weather (IQAir)...");
    for (const city of cities) {
      try {
        if (!city.state || !city.country) {
          throw new Error("missing state/country for IQAir lookup");
        }
        const json = await getAQI(city.name, city.state, city.country);
        const cur = json.data.current;
        city.aqi            = cur.pollution?.aqius  ?? null;
        city.temperature    = cur.weather?.tp        ?? null;
        city.humidity       = cur.weather?.hu        ?? null;
        city.pressure       = cur.weather?.pr        ?? null;
        city.wind_speed     = cur.weather?.ws        ?? null;
        city.wind_direction = cur.weather?.wd        ?? null;
        city.heat_index     = cur.weather?.heatIndex ?? null;
        console.log(`[aqi] ${city.name}: AQI=${city.aqi} temp=${city.temperature}`);
      } catch (err: any) {
        city.aqi = null; city.temperature = null; city.humidity = null;
        city.pressure = null; city.wind_speed = null;
        city.wind_direction = null; city.heat_index = null;
        nullFields.push(`${city.name}.aqi (${err.message})`);
        console.error(`[aqi] ${city.name}: ${err.message}`);
      }
      await city.save();
      await sleep(65000); // IQAir free plan: ~1 call/minute hard limit. 65s = safe.
    }

    // ── Step 4: Weather via Open-Meteo for cities still missing temp ──────
    log.push("Fetching weather (Open-Meteo for remaining nulls)...");
    for (const city of cities) {
      if (city.temperature !== null && city.temperature !== undefined) continue;
      if (city.latitude == null || city.longitude == null) continue;
      try {
        const data = await getWeather(city.latitude, city.longitude);
        city.temperature = data?.current?.temperature_2m          ?? null;
        city.humidity    = data?.current?.relative_humidity_2m    ?? null;
        if (city.temperature !== null)
          console.log(`[weather] ${city.name}: temp=${city.temperature}`);
        else
          nullFields.push(`${city.name}.temperature (Open-Meteo no data)`);
      } catch (err: any) {
        nullFields.push(`${city.name}.temperature (Open-Meteo: ${err.message})`);
      }
      await city.save();
      // Open-Meteo is free + unlimited — no sleep needed
    }

    // ── Step 5: Hospital density via data.gov.in ──────────────────────────
    log.push("Fetching hospital density (data.gov.in)...");
    for (const city of cities) {
      try {
        const term = city.district || city.name;
        const count = await getHospitalDensity(term);
        city.hospital_density = count > 0 ? count : null;
        if (!count) nullFields.push(`${city.name}.hospital_density (count=0)`);
        else console.log(`[hosp] ${city.name}: ${count}`);
      } catch (err: any) {
        city.hospital_density = null;
        nullFields.push(`${city.name}.hospital_density (${err.message})`);
      }
      await city.save();
      await sleep(500); // gentle rate limit for data.gov.in
    }

    // ── Step 6: Schools from local CSV (no API) ───────────────────────────
    log.push("Loading school density from CSV...");
    for (const city of cities) {
      const count = getSchoolsFromCSV(city.name);
      city.school_density = count; // null if not in CSV
      if (count === null) nullFields.push(`${city.name}.school_density (not in CSV)`);
      await city.save();
    }

    // ── Step 7: Crime from local CSV (no API) ─────────────────────────────
    log.push("Loading crime data from CSV...");
    for (const city of cities) {
      const crime = getCrimeFromCSV(city.name);
      city.crime_rate = crime; // null if state not in CSV
      if (crime === null) nullFields.push(`${city.name}.crime_rate (not in CSV)`);
      await city.save();
    }

    // ── Step 8: Calculate livability scores ───────────────────────────────
    log.push("Calculating livability scores...");
    const fresh = await City.find();
    for (const city of fresh) {
      try {
        city.livability_score = calculateLivability(city);
        await city.save();
      } catch (err: any) {
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
    console.error("[ingest/all] Fatal:", error);
    return NextResponse.json(
      { success: false, error: error.message || String(error), log },
      { status: 500 }
    );
  }
}
