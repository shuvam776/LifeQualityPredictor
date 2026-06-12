import { NextResponse } from "next/server";
import { connectDB } from "@/config/dbConfig";
import City from "@/models/City";
import { getHospitalDensity } from "@/services/hospital.service";

export async function GET() {
  try {
    await connectDB();

    const cities = await City.find();

    for (const city of cities) {
      try {
        if (!city.name) continue;

        // Use district if available, otherwise fall back to city name
        const searchTerm = city.district || city.name;
        const count = await getHospitalDensity(searchTerm);

        city.hospital_density = count;
        await city.save();
        console.log(`[ingest/hospitals] ${city.name}: ${count} hospitals`);
      } catch (err: any) {
        console.error(
          `[ingest/hospitals] Error for ${city.name}:`,
          err.message || err
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Hospital density updated successfully",
    });
  } catch (error: any) {
    console.error("[ingest/hospitals] Route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || error },
      { status: 500 }
    );
  }
}