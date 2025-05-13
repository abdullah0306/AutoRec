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
    
    // Get the contact scraping results from the request body
    const { 
      url, 
      emails, 
      phones, 
      addresses, 
      postalCodes,
      linkedins,
      twitters,
      facebooks,
      instagrams,
      completedAt
    } = await request.json();

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Save the contact scraping results to the database
    const result = await prisma.contactScrapingResult.create({
      data: {
        userId: user.id,
        url,
        emails: emails || [],
        phones: phones || [],
        addresses: addresses || [],
        postalCodes: postalCodes || [],
        linkedins: linkedins || [],
        twitters: twitters || [],
        facebooks: facebooks || [],
        instagrams: instagrams || [],
        completedAt: new Date(completedAt)
      }
    });

    console.log(`Successfully saved contact scraping results to database for ${url}. Result ID: ${result.id}`);

    return NextResponse.json({ 
      success: true, 
      message: "Contact scraping results saved to database",
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
