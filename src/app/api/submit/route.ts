import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Process the body as needed.
    const result = {
      success: true,
      data: body,
      message: "Data received successfully",
    };
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Invalid data" },
      { status: 400 }
    );
  }
}
