import { getSchools } from "@/services/school.service";
import { connectDB } from "@/config/dbConfig";
import City from "@/models/City";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const cities = await City.find();

    for (const city of cities) {
      try {
        if (!city.name) continue;

        const searchTerm = city.district || city.name;
        const count = await getSchools(searchTerm);

        city.school_density = count;
        await city.save();
        console.log(`[ingest/schools] ${city.name}: ${count} schools`);
      } catch (err: any) {
        console.error(
          `[ingest/schools] Error for ${city.name}:`,
          err.message || err
        );
      }
    }

    return NextResponse.json({
      message: "School density updated successfully",
      success: true,
    });
  } catch (err: any) {
    console.error("[ingest/schools] Route error:", err);
    return NextResponse.json(
      { message: "Error", success: false, error: err.message || err },
      { status: 500 }
    );
  }
}