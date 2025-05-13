import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

// Store results in a JSON file since we don't have a database table for this
const RESULTS_DIR = path.join(process.cwd(), 'data');
const RESULTS_FILE = path.join(RESULTS_DIR, 'contact-scraping-results.json');

// Make sure the data directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Initialize the results file if it doesn't exist
if (!fs.existsSync(RESULTS_FILE)) {
  fs.writeFileSync(RESULTS_FILE, JSON.stringify({ results: [] }));
}

interface ContactScrapingResult {
  id: string;
  userId: string;
  url: string;
  emails: string[];
  phones: string[];
  addresses: string[];
  postal_codes: string[];
  linkedins: string[];
  twitters: string[];
  facebooks: string[];
  instagrams: string[];
  completed_at: string;
  created_at: string;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = authHeader.split(" ")[1];
    
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

    // Read existing results
    const fileContent = fs.readFileSync(RESULTS_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Create a new result entry
    const newResult: ContactScrapingResult = {
      id: Date.now().toString(),
      userId: email,
      url,
      emails,
      phones,
      addresses,
      postal_codes: postalCodes,
      linkedins: linkedins || [],
      twitters: twitters || [],
      facebooks: facebooks || [],
      instagrams: instagrams || [],
      completed_at: completedAt,
      created_at: new Date().toISOString()
    };
    
    // Add the new result
    data.results.push(newResult);
    
    // Save back to file
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CONTACT_SCRAPING_RESULTS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to save contact scraping results" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = authHeader.split(" ")[1];
    
    // Read results from file
    const fileContent = fs.readFileSync(RESULTS_FILE, 'utf-8');
    let data;
    
    try {
      data = JSON.parse(fileContent);
    } catch (parseError) {
      console.error("Error parsing JSON file:", parseError);
      // Return empty results if file is corrupted
      return NextResponse.json([]);
    }
    
    if (!data || !Array.isArray(data.results)) {
      console.error("Invalid data structure in results file");
      return NextResponse.json([]);
    }
    
    // Filter results for this user and ensure all fields exist
    const userResults = data.results
      .filter((result: any) => result && result.userId === email)
      .map((result: any) => {
        // Ensure all fields exist with defaults
        return {
          id: result.id || "",
          userId: result.userId || "",
          url: result.url || "",
          emails: Array.isArray(result.emails) ? result.emails : [],
          phones: Array.isArray(result.phones) ? result.phones : [],
          addresses: Array.isArray(result.addresses) ? result.addresses : [],
          postal_codes: Array.isArray(result.postal_codes) ? result.postal_codes : [],
          linkedins: Array.isArray(result.linkedins) ? result.linkedins : [],
          twitters: Array.isArray(result.twitters) ? result.twitters : [],
          facebooks: Array.isArray(result.facebooks) ? result.facebooks : [],
          instagrams: Array.isArray(result.instagrams) ? result.instagrams : [],
          completed_at: result.completed_at || new Date().toISOString(),
          created_at: result.created_at || new Date().toISOString()
        };
      });
    
    // Sort by created_at in descending order
    userResults.sort((a: ContactScrapingResult, b: ContactScrapingResult) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json(userResults);
  } catch (error) {
    console.error("[GET_CONTACT_SCRAPING_RESULTS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to get contact scraping results" },
      { status: 500 }
    );
  }
}
