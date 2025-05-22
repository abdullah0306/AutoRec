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

    const email = authHeader.split(" ")[1];
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the batch data from the request body
    const { 
      batchId,
      totalUrls,
      successfulUrls = 0,
      failedUrls = 0,
      totalEmails = 0,
      totalPhones = 0,
      totalAddresses = 0,
      totalPostalCodes = 0,
      status = 'completed',
      startedAt,
      completedAt
    } = await request.json();

    if (!batchId) {
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
    }

    // Create or update the batch record
    const batch = await prisma.scrapingBatch.upsert({
      where: { id: batchId },
      update: {
        totalUrls,
        successfulUrls,
        failedUrls,
        totalEmails,
        totalPhones,
        totalAddresses,
        totalPostalCodes,
        status,
        startedAt: startedAt ? new Date(startedAt) : null,
        completedAt: completedAt ? new Date(completedAt) : null,
        updatedAt: new Date()
      },
      create: {
        id: batchId,
        userId: user.id,
        totalUrls,
        successfulUrls,
        failedUrls,
        totalEmails,
        totalPhones,
        totalAddresses,
        totalPostalCodes,
        status,
        startedAt: startedAt ? new Date(startedAt) : null,
        completedAt: completedAt ? new Date(completedAt) : null,
      },
    });

    console.log(`Successfully ${batch ? 'created' : 'updated'} scraping batch ${batchId} for user ${user.email}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Scraping batch saved successfully',
      batch
    });
  } catch (error) {
    console.error("[SAVE_SCRAPING_BATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to save scraping batch" },
      { status: 500 }
    );
  }
}
