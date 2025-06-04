import { NextRequest, NextResponse } from 'next/server';

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

    // In a real application, we would fetch this data from a database
    // For now, we'll return mock data
    const mockData = {
      totalWebsitesScraped: 0,
      websitesIncrease: 0,
      successfulScrapes: 98,
      successfulScrapesChange: 2,
      averageScrapeTime: '2.5s',
      averageScrapeTimeChange: 0.5
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error in dashboard stats API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
