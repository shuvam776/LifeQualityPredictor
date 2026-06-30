export async function POST(req: Request) {
  const body = await req.json();

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return Response.json({
      success: false,
      detail: "BACKEND_URL environment variable is not configured."
    }, { status: 500 });
  }
  const response = await fetch(
    `${backendUrl}/predict`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const result = await response.json();

  return Response.json(result);
}