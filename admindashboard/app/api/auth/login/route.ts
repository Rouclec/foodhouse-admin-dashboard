import { NextResponse } from "next/server";
import { login } from "@/utils/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const result = await login(email, password);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
