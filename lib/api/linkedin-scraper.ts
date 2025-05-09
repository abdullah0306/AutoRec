import axios from 'axios';

// API configuration
const APIFY_TOKEN = 'apify_api_44QjgxPbbxWLAtrpjjfemN0hq9q9KX1QcPGi';
const API_ENDPOINT = 'https://api.apify.com/v2/acts/bebity~linkedin-premium-actor/run-sync-get-dataset-items';

export interface CandidateProfile {
  Name: string;
  Headline: string;
  Location: string;
  "LinkedIn Profile Link": string;
  "Most Recent Experience": string;
  Skills: string[];
  Experience: {
    company: string;
    title: string;
    duration: string;
    location: string;
    description: string;
  }[];
  Education: {
    school: string;
    degree: string;
    duration: string;
  }[];
  About: string;
  Certifications: {
    name: string;
    issuer: string;
    date: string;
    credential: string;
  }[];
  avatar?: string; // For UI display
}

export interface SearchParams {
  skills: string;
  experience: string;
  location: string;
}

export interface SearchResponse {
  candidates: CandidateProfile[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    hasMore: boolean;
    searchedLocation: string;
  };
  message: string;
}

// Function to search for candidates
export async function searchCandidates(
  params: SearchParams,
  email: string
): Promise<SearchResponse & { candidatesPerSearch: number }> {
  const { skills, experience, location } = params;
  
  if (!email) {
    throw new Error('Not authenticated');
  }

  // Get user's subscription type and set package limits
  const subscriptionResponse = await axios.get('/api/me', {
    headers: {
      'Authorization': `Bearer ${email}`
    }
  });

  if (!subscriptionResponse.data?.subscription?.package?.name) {
    throw new Error('No active subscription');
  }

  // Set candidates per search based on package
  let candidatesPerSearch = subscriptionResponse.data.subscription.package.name === 'Professional' ? 30 : 15;
  
  try {
    // Validate required parameters
    if (!skills) {
      throw new Error('Skills are required for the search');
    }

    // Function to fetch profiles with retries
    const fetchProfiles = async (searchLoc: string, retryCount = 0) => {
      // Define search params with proper type
      const searchParams: {
        action: string;
        keywords: string[];
        isUrl: boolean;
        isName: boolean;
        limit: number;
        location: string[];
        experienceFilter?: { years: number };
      } = {
        action: "get-profiles",
        keywords: [skills],
        isUrl: false,
        isName: false,
        limit: candidatesPerSearch,
        location: [searchLoc]
      };

      if (experience && !isNaN(parseInt(experience))) {
        searchParams.experienceFilter = {
          years: parseInt(experience)
        };
      }

      try {
        const response = await axios.post(
          `${API_ENDPOINT}?token=${APIFY_TOKEN}`,
          searchParams,
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (!Array.isArray(response.data)) {
          throw new Error('Invalid response structure');
        }

        return response.data;
      } catch (error) {
        if (retryCount < 2) { // Try up to 2 more times
          console.log(`Retry attempt ${retryCount + 1} for ${searchLoc}`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
          return fetchProfiles(searchLoc, retryCount + 1);
        }
        throw error;
      }
    };

    // Fetch profiles
    const profiles = await fetchProfiles(location);

    // Process profiles
    const allProfiles = profiles
      .filter((profile: any) => 
        profile && profile.firstName && 
        profile.lastName && 
        profile.EXPERIENCE && 
        Array.isArray(profile.EXPERIENCE) && 
        profile.EXPERIENCE.length > 0
      )
      .slice(0, candidatesPerSearch) // Ensure we don't exceed package limit
      .map(profile => {
        const recentExperiences = (profile.EXPERIENCE || [])
          .slice(0, 4)
          .map((exp: { title: any; subtitle: any; caption: any; }) => ({
            title: exp.title || '',
            company: exp.subtitle || '',
            duration: exp.caption || ''
          }));

        const formattedExperience = recentExperiences
          .map((exp: { title: any; company: any; duration: any; }) => `${exp.title}${exp.company ? ` at ${exp.company}` : ''}${exp.duration ? ` (${exp.duration})` : ''}`)
          .join(' | ');

        const experience = (profile.EXPERIENCE || []).map((exp: { subtitle: any; title: any; caption: any; meta: any; child: { text: any; }[]; }) => ({
          company: exp.subtitle || '',
          title: exp.title || '',
          duration: exp.caption || '',
          location: exp.meta || '',
          description: exp.child?.[0]?.text || ''
        }));

        const education = (profile.EDUCATION || []).map((edu: { title: any; subtitle: any; caption: any; }) => ({
          school: edu.title || '',
          degree: edu.subtitle || '',
          duration: edu.caption || ''
        }));

        const about = profile.ABOUT?.[0]?.text || '';

        // Create initials for avatar
        const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`;

        return {
          Name: profile.firstName && profile.lastName ?
            `${profile.firstName} ${profile.lastName}` :
            profile.Name || '',
          "Most Recent Experience": formattedExperience || 'N/A',
          Skills: Array.isArray(profile.headline) ? profile.headline : (profile.headline ? [profile.headline] : []),
          Headline: profile.headline || profile.Headline || '',
          "LinkedIn Profile Link": profile.url || profile["LinkedIn Profile Link"] || '',
          Location: profile.meta || profile.Location || '',
          Experience: experience,
          Education: education,
          About: about,
          Certifications: (profile.LICENSES_AND_CERTIFICATIONS || []).map((cert: { title: any; subtitle: any; caption: any; meta: any; }) => ({
            name: cert.title || '',
            issuer: cert.subtitle || '',
            date: cert.caption || '',
            credential: cert.meta || ''
          })),
          avatar: initials // Add initials for avatar
        };
      });

    // Use all profiles without pagination, ensuring we don't exceed the package limit
    const candidates = allProfiles.slice(0, candidatesPerSearch);
    const totalResults = candidates.length;

    // Check credits and update usage if we found candidates
    if (candidates.length > 0) {
      const usageResponse = await axios.post('/api/subscriptions/usage', {
        usageType: 'candidate',
        count: candidates.length
      }, {
        headers: {
          'Authorization': `Bearer ${email}`
        }
      });

      if (!usageResponse.data.success) {
        throw new Error(usageResponse.data.error || 'Not enough credits');
      }

      // Update candidatesPerSearch from the response
      candidatesPerSearch = usageResponse.data.candidatesPerSearch || candidatesPerSearch;
    }

    return {
      candidatesPerSearch,
      candidates,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalResults,
        hasMore: false,
        searchedLocation: location
      },
      message: candidates.length > 0 ?
        `Successfully retrieved ${candidates.length} candidates from ${location}` :
        'No matching candidates found'
    };

  } catch (error) {
    console.error('Error searching candidates:', error);
    throw error;
  }
}
