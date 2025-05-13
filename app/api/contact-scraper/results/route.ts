import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = authHeader.split(" ")[1];
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all contact scraping results for this user from the database
    const results = await prisma.contactScrapingResult.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Successfully retrieved ${results.length} contact scraping results from database for user ${user.email}`);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error("[GET_CONTACT_SCRAPING_RESULTS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to get contact scraping results" },
      { status: 500 }
    );
  }
}
