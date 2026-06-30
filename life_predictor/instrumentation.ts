
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[startup] Auto-ingestion on server startup disabled to respect rate limits. Trigger ingestion manually via script or UI.");
  }
}
