/**
 * Utility functions for handling subscription usage
 */

/**
 * Check initial credits for contact scraping (pre-scraping check)
 * @param email User's email for authentication
 * @param websiteCount Number of websites to scrape
 * @returns Object containing success status and remaining credits
 */
export async function checkInitialContactScrapingCredits(
  email: string,
  websiteCount: number = 1
): Promise<{ 
  success: boolean; 
  remainingCredits?: number; 
  error?: string;
  packageName?: string;
  estimatedCreditsNeeded?: number;
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
    
    // Estimate credits needed (average of 10 credits per website as initial estimate)
    // This is just an estimate for the initial check, actual deduction will be based on results
    const packageName = packageData.packageName || 'Basic';
    const estimatedCreditsPerSite = 10; // Conservative estimate
    const estimatedCreditsNeeded = websiteCount * estimatedCreditsPerSite;
    
    // Call the subscription usage API to check only (no deduction yet)
    const response = await fetch('/api/subscriptions/usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${email}`
      },
      body: JSON.stringify({
        usageType: 'scraping',
        count: 0, // Just checking, not deducting
        checkOnly: true
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to check subscription usage'
      };
    }
    
    // Check if user has enough estimated credits
    if (data.remainingUsage < estimatedCreditsNeeded) {
      return {
        success: false,
        error: `You may not have enough credits. Estimated credits needed: ${estimatedCreditsNeeded}, remaining: ${data.remainingUsage}`,
        remainingCredits: data.remainingUsage,
        packageName: packageName,
        estimatedCreditsNeeded
      };
    }
    
    return {
      success: true,
      remainingCredits: data.remainingUsage,
      packageName: packageName,
      estimatedCreditsNeeded
    };
  } catch (error) {
    console.error('Error checking subscription usage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error checking subscription'
    };
  }
}

/**
 * Deduct credits for contact scraping based on actual results
 * @param email User's email for authentication
 * @param results Object containing counts of different result types
 * @returns Object containing success status and remaining credits
 */
export async function deductCreditsForContactResults(
  email: string,
  results: {
    emails: number;
    phones: number;
    socialLinks: number; // Combined count of LinkedIn, Twitter, Facebook, Instagram
  }
): Promise<{ 
  success: boolean; 
  remainingCredits?: number; 
  error?: string;
  creditsDeducted?: number;
}> {
  try {
    // Calculate credits to deduct based on actual results
    // 1 credit per email, 1 credit per phone, 1 credit per social media link
    const creditsToDeduct = results.emails + results.phones + results.socialLinks;
    
    // If no results were found, don't deduct any credits
    if (creditsToDeduct === 0) {
      return {
        success: true,
        remainingCredits: 0, // We'll get this from the API response
        creditsDeducted: 0
      };
    }
    
    const finalCreditsToDeduct = creditsToDeduct;
    
    // Call the subscription usage API to deduct credits
    const response = await fetch('/api/subscriptions/usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${email}`
      },
      body: JSON.stringify({
        usageType: 'scraping',
        count: finalCreditsToDeduct,
        checkOnly: false
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to deduct credits',
        creditsDeducted: 0
      };
    }
    
    return {
      success: true,
      remainingCredits: data.remainingUsage,
      creditsDeducted: finalCreditsToDeduct
    };
  } catch (error) {
    console.error('Error deducting credits:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error deducting credits',
      creditsDeducted: 0
    };
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use checkInitialContactScrapingCredits and deductCreditsForContactResults instead
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
  // This function is kept for backward compatibility
  // It uses the new approach internally
  if (checkOnly) {
    const result = await checkInitialContactScrapingCredits(email, websiteCount);
    return {
      ...result,
      creditsPerScrape: result.estimatedCreditsNeeded ? result.estimatedCreditsNeeded / websiteCount : 10
    };
  } else {
    // For actual deduction, we'll use a fixed minimum value since we don't have results yet
    // This should be replaced with the new approach in the contact-scraping-context.tsx
    const minCreditsPerSite = 5;
    const result = await deductCreditsForContactResults(email, {
      emails: minCreditsPerSite * websiteCount,
      phones: 0,
      socialLinks: 0
    });
    
    return {
      ...result,
      packageName: 'Unknown', // We don't have this info here
      creditsPerScrape: minCreditsPerSite
    };
  }
}
