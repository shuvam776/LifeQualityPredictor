import { NextResponse } from "next/server";

export async function POST() {
  (global as any).abortIngestion = true;
  return NextResponse.json({ success: true, message: "Aborted request registered." });
}
