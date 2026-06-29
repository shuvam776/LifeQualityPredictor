import { NextResponse } from "next/server";
import { connectDB } from "@/config/dbConfig";
import City from "@/models/City";

export async function GET(request: Request) {
  try {
    await connectDB();
    const cities = await City.find().sort({ name: 1 });
    return NextResponse.json(cities);
  } catch (error: any) {
    console.error("Error in getting cities:", error);
    return NextResponse.json(
      {
        message: "Error in getting cities",
        success: false,
        error: error.message || error,
      },
      { status: 500 }
    );
  }
}