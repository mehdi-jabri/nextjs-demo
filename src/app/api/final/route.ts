import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Extract the JSON payload from the request
    const body = await request.json();

    // Retrieve the external API URL from environment variables
    const externalApiUrl = process.env.EXTERNAL_API_URL;
    if (!externalApiUrl) {
      throw new Error("EXTERNAL_API_URL is not defined in the environment variables.");
    }

    // Get the Authorization header from the incoming request (which contains the access token)
    const authHeader = request.headers.get("authorization");

    // Make the POST request to the external API, passing the Authorization header if available
    const externalResponse = await fetch(externalApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!externalResponse.ok) {
      let errorMessage = "External API error";
      try {
        const errorData = await externalResponse.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Leave errorMessage unchanged
      }
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: externalResponse.status }
      );
    }

    const data = await externalResponse.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
