/**
 * Utility functions for handling subscription usage
 */

/**
 * Check if user has enough credits and deduct credits for contact scraping
 * @param email User's email for authentication
 * @param websiteCount Number of websites to scrape
 * @param checkOnly If true, only check credits without deducting
 * @returns Object containing success status and remaining credits
 */
export async function checkAndDeductContactScrapingCredits(
  email: string,
  websiteCount: number = 1,
  checkOnly: boolean = false
): Promise<{ 
  success: boolean; 
  remainingCredits?: number; 
  error?: string;
  packageName?: string;
  creditsPerScrape?: number;
}> {
  try {
    // First, get the user's package information
    const packageResponse = await fetch('/api/subscriptions/info', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${email}`
      }
    });
    
    const packageData = await packageResponse.json();
    
    if (!packageResponse.ok) {
      return {
        success: false,
        error: packageData.error || 'Failed to get subscription information'
      };
    }
    
    // Determine credits per scrape based on package
    // Basic package: 15 credits per scrape
    // Higher packages: 30 credits per scrape
    const packageName = packageData.packageName || 'Basic';
    const creditsPerScrape = packageName === 'Basic' ? 15 : 30;
    
    // Calculate total credits needed
    const creditsNeeded = websiteCount * creditsPerScrape;
    
    // Call the subscription usage API
    const response = await fetch('/api/subscriptions/usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${email}`
      },
      body: JSON.stringify({
        usageType: 'scraping',
        count: checkOnly ? 0 : creditsNeeded,
        checkOnly: checkOnly
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to check subscription usage'
      };
    }
    
    return {
      success: true,
      remainingCredits: data.remainingUsage,
      packageName: packageName,
      creditsPerScrape
    };
  } catch (error) {
    console.error('Error checking subscription usage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error checking subscription'
    };
  }
}
