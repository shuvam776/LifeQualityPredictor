import { NextResponse } from "next/server";
import { connectDB } from "@/config/dbConfig";
import City from "@/models/City";
import { calculateLivability } from "@/lib/calculateLivability";

export async function GET() {
  try {
    await connectDB();
    const cities = await City.find();

    for (const city of cities) {
      try {
        if (city.name) {
          // Calculate livability score by passing the city object itself
          const scoreResult = calculateLivability(city);
          
          city.livability_score = scoreResult;
          await city.save();
        }
      } catch (err) {
        console.error(`Error calculating score for ${city.name}:`, err);
      }
    }

    return NextResponse.json({ message: "Scores updated successfully", success: true });
  } catch (error: any) {
    console.error("Error in score ingest route:", error);
    return NextResponse.json({ message: "Error updating scores", success: false, error: error.message }, { status: 500 });
  }
}
