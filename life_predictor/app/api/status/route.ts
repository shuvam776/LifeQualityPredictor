import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({
        status: "offline",
        message: "BACKEND_URL environment variable is not configured."
      });
    }
    const response = await fetch(`${backendUrl}/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return NextResponse.json({
        status: "offline",
        message: "FastAPI backend is offline or returned an error."
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({
      status: "offline",
      message: `FastAPI backend is unreachable: ${error.message}`
    });
  }
}
