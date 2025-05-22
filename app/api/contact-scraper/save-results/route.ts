import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    
    // Get the contact scraping results from the request body
    const { 
      batchId,
      url, 
      emails = [], 
      phones = [], 
      addresses = [], 
      postalCodes = [],
      status = 'completed',
      error = null,
      completedAt
    } = await request.json();

    if (!batchId || !url) {
      return NextResponse.json(
        { error: "Missing required fields (batchId, url)" }, 
        { status: 400 }
      );
    }

    // Find the user by token (email)
    const user = await prisma.user.findUnique({
      where: { email: token }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if this result already exists
    const existingResult = await prisma.contactScrapingResult.findFirst({
      where: {
        batch: {
          id: batchId
        },
        url,
        user: {
          id: user.id
        }
      }
    });

    let result;
    
    // First, verify the batch exists
    const batch = await prisma.scrapingBatch.findUnique({
      where: { id: batchId }
    });

    if (!batch) {
      console.error(`Batch with ID ${batchId} not found`);
      return NextResponse.json(
        { error: `Batch with ID ${batchId} not found` },
        { status: 400 }
      );
    }
    
    if (existingResult) {
      // Update existing result
      result = await prisma.contactScrapingResult.update({
        where: { id: existingResult.id },
        data: {
          emails: { set: emails },
          phones: { set: phones },
          addresses: { set: addresses },
          postalCodes: { set: postalCodes },
          status: status as any, // Assuming status is a valid enum value
          error,
          scrapedAt: new Date(completedAt),
          updatedAt: new Date()
        }
      });
    } else {
      // Create new result
      result = await prisma.contactScrapingResult.create({
        data: {
          userId: user.id,
          batchId: batchId,
          url,
          emails,
          phones,
          addresses,
          postalCodes,
          status: status as any, // Assuming status is a valid enum value
          error,
          scrapedAt: new Date(completedAt)
        }
      });
    }

    console.log(`Successfully ${existingResult ? 'updated' : 'saved'} contact scraping results for ${url}. Result ID: ${result.id}`);

    return NextResponse.json({ 
      success: true, 
      message: `Contact scraping results ${existingResult ? 'updated' : 'saved'} to database`,
      resultId: result.id
    });
  } catch (error) {
    console.error("[SAVE_CONTACT_SCRAPING_RESULTS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to save contact scraping results" },
      { status: 500 }
    );
  }
}
