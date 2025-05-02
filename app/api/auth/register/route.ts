import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUser } from "@/lib/server-auth";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const username = data.email; // Using email as username
    const email = data.email;
    const password = data.password;
    // Handle both camelCase and snake_case field names
    const first_name = data.first_name || data.firstName;
    const last_name = data.last_name || data.lastName;

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: existingUser.username === username
            ? "Username already exists"
            : "Email already exists",
        },
        { status: 400 }
      );
    }

    // Create user using server-side auth
    const user = await createUser({
      username,
      email,
      password,
      first_name,
      last_name,
    });

    // TODO: Send verification email
    // For now, we'll just return success
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      },
      message: "Registration successful. Please check your email to verify your account.",
    });

  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
