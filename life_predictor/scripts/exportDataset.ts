import mongoose from "mongoose";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import "@/config/envConfig"
import City from "@/models/City";

async function exportDataset() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const cities = await City.find().lean();

  const rows = cities.map((city: any) => ({
    city: city.city,

    latitude: city.latitude,
    longitude: city.longitude,

    aqi: city.aqi,

    temperature: city.temperature,
    humidity: city.humidity,

    pressure: city.pressure,
    wind_speed: city.wind_speed,
    wind_direction: city.wind_direction,

    heat_index: city.heat_index,

    crime_rate: city.crime_rate,

    hospital_density: city.hospital_density,
    school_density: city.school_density,

    internet_score: city.internet_score,

    employment_rate: city.employment_rate,

    green_cover: city.green_cover,

    cost_of_living: city.cost_of_living,

    population_density: city.population_density,

    livability_score: city.livability_score,
  }));

  const workbook = XLSX.utils.book_new();

  const worksheet =
    XLSX.utils.json_to_sheet(rows);

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Cities"
  );

  const outputDir =
    path.join(process.cwd(), "data");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  XLSX.writeFile(
    workbook,
    path.join(outputDir, "dataset.csv"),
    {
      bookType: "csv",
    }
  );

  console.log("dataset.csv exported");

  process.exit();
}

exportDataset();