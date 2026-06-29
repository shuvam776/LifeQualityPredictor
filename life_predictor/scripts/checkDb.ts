import mongoose from "mongoose";
import City from "../models/City";
import "../config/envConfig";

async function checkDb() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const count = await City.countDocuments();
  console.log(`Total cities in database: ${count}`);
  
  const cities = await City.find().lean();
  for (const c of cities) {
    const nullFields = Object.keys(c).filter(k => (c as any)[k] === null);
    console.log(`City: ${c.name} | Livability Score: ${c.livability_score} | Null fields: [${nullFields.join(", ")}]`);
  }
  
  process.exit(0);
}

checkDb().catch(console.error);
