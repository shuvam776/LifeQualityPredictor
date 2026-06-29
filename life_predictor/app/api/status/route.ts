import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("http://127.0.0.1:8000/status", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 0 } // Disable cache
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
