/**
 * Next.js Instrumentation Hook
 * 
 * This file runs once when the Next.js server starts up (both dev and production).
 * We use it to trigger the full data ingestion pipeline automatically.
 * 
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only run on the Node.js runtime (not Edge), and only once on server startup
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[startup] Triggering data ingestion pipeline...");

    // We use a short delay to ensure the server is fully ready before
    // making internal HTTP requests to our own API routes
    setTimeout(async () => {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}/api/ingest/all`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        console.log("[startup] Ingestion result:", JSON.stringify(data, null, 2));
      } catch (err) {
        console.error("[startup] Ingestion failed:", err);
      }
    }, 3000); // 3 second delay to ensure the server is ready
  }
}
