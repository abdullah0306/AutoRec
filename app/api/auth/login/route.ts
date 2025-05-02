import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/server-auth";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Verify user credentials
    const user = await verifyUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Return user data without sensitive information
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: user.is_active,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("[LOGIN_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
