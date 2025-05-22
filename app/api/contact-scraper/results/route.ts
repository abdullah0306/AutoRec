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
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build the where clause
    const whereClause: any = {
      userId: user.id
    };

    // Add batchId filter if provided
    if (batchId) {
      whereClause.batchId = batchId;
    }

    // Get contact scraping results from the database
    const results = await prisma.contactScrapingResult.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        batch: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            completedAt: true
          }
        }
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
