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

    // Make the POST request to the external API
    const externalResponse = await fetch(externalApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Include additional headers if needed (e.g., Authorization)
      },
      body: JSON.stringify(body),
    });

    // If the external API did not respond with a success status, extract the error message and return an error response.
    if (!externalResponse.ok) {
      let errorMessage = "External API error";
      try {
        const errorData = await externalResponse.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If error response is not JSON, leave errorMessage as is.
      }
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: externalResponse.status }
      );
    }

    // Parse the successful response data
    const data = await externalResponse.json();

    // Return the data to the client
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
