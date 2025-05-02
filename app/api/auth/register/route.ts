import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Generate email verification token
    const emailVerificationToken = uuidv4();
    const emailVerificationExpiry = new Date();
    emailVerificationExpiry.setHours(emailVerificationExpiry.getHours() + 24); // 24 hour expiry

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        hashed_password: hashedPassword,
        first_name,
        last_name,
        email_verification_token: emailVerificationToken,
        email_verification_expiry: emailVerificationExpiry,
      },
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
