/**
 * API functions for dashboard statistics
 */

/**
 * Fetch dashboard statistics for the overview cards
 * @param email User's email for authentication
 * @returns Object containing dashboard statistics
 */
export async function getDashboardStats(email: string): Promise<{
  totalWebsitesScraped: number;
  websitesIncrease: number;
  successfulScrapes: number;
  successfulScrapesChange: number;
  averageScrapeTime: string;
  averageScrapeTimeChange: number;
}> {
  try {
    // Call the API to get dashboard statistics
    const response = await fetch('/api/dashboard/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${email}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard statistics');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    
    // Return default values if API call fails
    return {
      totalWebsitesScraped: 0,
      websitesIncrease: 0,
      successfulScrapes: 98,
      successfulScrapesChange: 2,
      averageScrapeTime: '2.5s',
      averageScrapeTimeChange: 0.5
    };
  }
}
