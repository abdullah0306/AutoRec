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

    // Get all contact scraping results for this user
    const results = await prisma.contactScrapingResult.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate analytics data
    const analytics = {
      // Data type statistics
      dataTypeStats: [
        { 
          name: "Emails", 
          count: results.reduce((sum, result) => sum + (result.emails?.length || 0), 0),
          growth: calculateGrowth(results, 'emails')
        },
        { 
          name: "Phone Numbers", 
          count: results.reduce((sum, result) => sum + (result.phones?.length || 0), 0),
          growth: calculateGrowth(results, 'phones')
        },
        { 
          name: "Addresses", 
          count: results.reduce((sum, result) => sum + (result.addresses?.length || 0), 0),
          growth: calculateGrowth(results, 'addresses')
        },
        { 
          name: "Postal Codes", 
          count: results.reduce((sum, result) => sum + (result.postalCodes?.length || 0), 0),
          growth: calculateGrowth(results, 'postalCodes')
        },
      ],
      
      // Time series data (last 3 months)
      timeSeriesData: generateTimeSeriesData(results),
      
      // Success rate data
      successRateData: [
        { 
          name: "Successful", 
          value: results.filter(r => 
            r.emails?.length > 0 || 
            r.phones?.length > 0 || 
            r.linkedins?.length > 0 || 
            r.twitters?.length > 0 || 
            r.facebooks?.length > 0 || 
            r.instagrams?.length > 0
          ).length 
        },
        { 
          name: "Failed", 
          value: results.filter(r => 
            (!r.emails || r.emails.length === 0) && 
            (!r.phones || r.phones.length === 0) && 
            (!r.linkedins || r.linkedins.length === 0) && 
            (!r.twitters || r.twitters.length === 0) && 
            (!r.facebooks || r.facebooks.length === 0) && 
            (!r.instagrams || r.instagrams.length === 0)
          ).length 
        },
      ],
      
      // Total scrapes
      totalScrapes: results.length,
      
      // Most recent scrape
      mostRecentScrape: results.length > 0 ? results[0].createdAt : null,
      
      // Most successful domain
      mostSuccessfulDomain: findMostSuccessfulDomain(results)
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[GET_ANALYTICS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to get analytics data" },
      { status: 500 }
    );
  }
}

// Helper function to calculate growth percentage
function calculateGrowth(results: any[], field: string): number {
  if (results.length < 2) return 0;
  
  // Group results by month
  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(now.getMonth() - 1);
  const twoMonthsAgo = new Date(now);
  twoMonthsAgo.setMonth(now.getMonth() - 2);
  
  // Current month data
  const currentMonthResults = results.filter(r => 
    new Date(r.createdAt) >= oneMonthAgo && new Date(r.createdAt) <= now
  );
  
  // Previous month data
  const previousMonthResults = results.filter(r => 
    new Date(r.createdAt) >= twoMonthsAgo && new Date(r.createdAt) < oneMonthAgo
  );
  
  // Calculate counts
  const currentCount = currentMonthResults.reduce((sum, result) => sum + (result[field]?.length || 0), 0);
  const previousCount = previousMonthResults.reduce((sum, result) => sum + (result[field]?.length || 0), 0);
  
  // Calculate growth
  if (previousCount === 0) return currentCount > 0 ? 100 : 0;
  return Math.round(((currentCount - previousCount) / previousCount) * 100);
}

// Helper function to generate time series data
function generateTimeSeriesData(results: any[]): any[] {
  // Get the last 3 months
  const months = [];
  const now = new Date();
  
  for (let i = 2; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(now.getMonth() - i);
    months.push({
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      emails: 0,
      phones: 0,
      addresses: 0
    });
  }
  
  // Populate data for each month
  results.forEach(result => {
    const date = new Date(result.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const monthData = months.find(m => m.date === monthKey);
    if (monthData) {
      monthData.emails += result.emails?.length || 0;
      monthData.phones += result.phones?.length || 0;
      monthData.addresses += result.addresses?.length || 0;
    }
  });
  
  return months;
}

// Helper function to find the most successful domain
function findMostSuccessfulDomain(results: any[]): string {
  if (results.length === 0) return "N/A";
  
  // Group results by domain
  const domainStats: {[key: string]: number} = {};
  
  results.forEach(result => {
    try {
      const url = new URL(result.url);
      const domain = url.hostname;
      
      const dataCount = 
        (result.emails?.length || 0) + 
        (result.phones?.length || 0) + 
        (result.linkedins?.length || 0) + 
        (result.twitters?.length || 0) + 
        (result.facebooks?.length || 0) + 
        (result.instagrams?.length || 0);
      
      if (!domainStats[domain]) {
        domainStats[domain] = 0;
      }
      
      domainStats[domain] += dataCount;
    } catch (error) {
      // Skip invalid URLs
      console.error("Invalid URL:", result.url);
    }
  });
  
  // Find domain with highest data count
  let maxCount = 0;
  let mostSuccessfulDomain = "N/A";
  
  Object.entries(domainStats).forEach(([domain, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostSuccessfulDomain = domain;
    }
  });
  
  return mostSuccessfulDomain;
}
