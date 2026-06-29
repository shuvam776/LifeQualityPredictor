export async function POST(req: Request) {
  const body = await req.json();

  const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
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