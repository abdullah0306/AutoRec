import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { username, email, password, firstName, lastName } = await req.json();

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
        hashedPassword,
        firstName,
        lastName,
        emailVerificationToken,
        emailVerificationExpiry,
      },
    });

    // TODO: Send verification email
    // For now, we'll just return success
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
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
