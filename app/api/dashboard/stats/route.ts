import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/dashboard/stats
 * Returns dashboard statistics for the overview cards
 */
export async function GET(request: NextRequest) {
  try {
    // Check for authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Extract user email from token
    const userEmail = authHeader.split('Bearer ')[1];
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get total websites scraped (from ContactScrapingResult)
    const totalWebsitesScraped = await prisma.contactScrapingResult.count({
      where: { userId: user.id }
    });
    
    // Get total websites scraped in the previous month for comparison
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const previousMonthScraped = await prisma.contactScrapingResult.count({
      where: {
        userId: user.id,
        scrapedAt: {
          lt: oneMonthAgo
        }
      }
    });
    
    // Calculate percentage increase
    let websitesIncrease = 0;
    if (previousMonthScraped > 0) {
      const newScrapesThisMonth = totalWebsitesScraped - previousMonthScraped;
      websitesIncrease = Math.round((newScrapesThisMonth / previousMonthScraped) * 100);
    }
    
    // Get successful scrapes percentage
    const successfulScrapes = await prisma.contactScrapingResult.count({
      where: {
        userId: user.id,
        status: 'completed'
      }
    });
    
    const successfulScrapesPercentage = totalWebsitesScraped > 0 
      ? Math.round((successfulScrapes / totalWebsitesScraped) * 100)
      : 98; // Default to 98% if no scrapes yet
    
    // For now, we'll keep some mock data for metrics we can't easily calculate
    return NextResponse.json({
      totalWebsitesScraped,
      websitesIncrease,
      successfulScrapes: successfulScrapesPercentage,
      successfulScrapesChange: 2,
      averageScrapeTime: '2.5s',
      averageScrapeTimeChange: 0.5
    });
  } catch (error) {
    console.error('Error in dashboard stats API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
