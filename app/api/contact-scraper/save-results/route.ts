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
    const { results } = await request.json();

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: "No results provided or invalid format" }, 
        { status: 400 }
      );
    }

    // Validate each result has required fields
    for (const result of results) {
      if (!result.batchId || !result.url) {
        return NextResponse.json(
          { error: "Each result must include batchId and url" }, 
          { status: 400 }
        );
      }
    }

    // Find the user by token (email)
    const user = await prisma.user.findUnique({
      where: { email: token }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const savedResults = [];
    console.log(`Processing ${results.length} results`);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      console.log(`Processing result ${i + 1}/${results.length} for URL: ${result.url}`);
      
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
      } = result;

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
      
      // Verify the batch exists
      const batch = await prisma.scrapingBatch.findUnique({
        where: { id: batchId }
      });

      if (!batch) {
        const errorMsg = `Batch with ID ${batchId} not found for URL: ${result.url}`;
        console.error(errorMsg);
        continue; // Skip this result if batch not found
      }
      
      let savedResult;
      
      try {
        if (existingResult) {
          console.log(`Updating existing result for URL: ${url}`);
          // Update existing result
          savedResult = await prisma.contactScrapingResult.update({
          where: { id: existingResult.id },
          data: {
            emails: { set: emails },
            phones: { set: phones },
            addresses: { set: addresses },
            postalCodes: { set: postalCodes },
            status: status as any,
            error,
            scrapedAt: new Date(completedAt),
            updatedAt: new Date()
          }
          });
        } else {
          console.log(`Creating new result for URL: ${url}`);
          // Create new result
          savedResult = await prisma.contactScrapingResult.create({
          data: {
            userId: user.id,
            batchId: batchId,
            url,
            emails,
            phones,
            addresses,
            postalCodes,
            status: status as any,
            error,
            scrapedAt: new Date(completedAt)
        }
      });
    }

    console.log(`Successfully ${existingResult ? 'updated' : 'saved'} contact scraping results for ${url}. Result ID: ${result.id}`);

        savedResults.push(savedResult);
        console.log(`Successfully processed result for URL: ${url}`);
      } catch (error) {
        console.error(`Error processing result for URL ${url}:`, error);
        // Don't rethrow, continue with next result
      }
    }

    return NextResponse.json({ success: true, count: savedResults.length });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in save-results endpoint:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: request.body ? 'Body exists' : 'No body',
      resultsCount: results?.length || 0
    });
    return NextResponse.json(
      { 
        error: 'Failed to save contact scraping results',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
