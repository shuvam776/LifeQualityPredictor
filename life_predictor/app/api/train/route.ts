import { NextResponse } from "next/server";

export async function POST() {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({
        success: false,
        message: "BACKEND_URL environment variable is not configured."
      }, { status: 500 });
    }
    const response = await fetch(`${backendUrl}/train`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: "FastAPI training failed."
      }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: `FastAPI backend is unreachable: ${error.message}`
    }, { status: 500 });
  }
}
