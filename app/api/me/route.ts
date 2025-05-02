import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Get the user ID from the session or token
    // For now, we'll get it from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    // In a real app, you'd verify the JWT token here
    // For now, we'll assume the token is the user's email
    const user = await prisma.user.findFirst({
      where: {
        email: token,
      },
      select: {
        id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        is_active: true,
        created_at: true,
        subscription: {
          select: {
            id: true,
            isActive: true,
            startDate: true,
            endDate: true,
            monthlyUsage: true,
            monthlyEmailUsage: true,
            monthlyCandidateUsage: true,
            lastUsageReset: true,
            package: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                maxMonthlyScrapes: true,
                maxUrlsPerBatch: true,
                maxPagesPerSite: true,
                concurrentSites: true,
                maxMonthlyEmails: true,
                maxEmailsPerSite: true,
                maxCandidateProfiles: true,
                maxProfilesPerBatch: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[GET_USER_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const data = await req.json();
    const { first_name, last_name } = data;

    // Find user by email (token)
    const user = await prisma.user.update({
      where: {
        email: token,
      },
      data: {
        first_name,
        last_name,
      },
      select: {
        id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        is_active: true,
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[UPDATE_USER_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
