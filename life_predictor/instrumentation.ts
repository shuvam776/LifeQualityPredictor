/**
 * Next.js Instrumentation Hook
 * 
 * This file runs once when the Next.js server starts up (both dev and production).
 * We use it to trigger the full data ingestion pipeline automatically.
 * 
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[startup] Auto-ingestion on server startup disabled to respect rate limits. Trigger ingestion manually via script or UI.");
  }
}
