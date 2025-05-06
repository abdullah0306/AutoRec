import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Find user by email (token)
    const user = await prisma.user.findFirst({
      where: { email: token }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = await req.json();
    const { linkedinProfileUrl, Name, title, Location, Experience, Education, Skills, About, matchPercentage } = data;

    // Create the selected candidate record
    const selectedCandidate = await prisma.selectedCandidate.create({
      data: {
        userId: user.id,
        linkedinProfileUrl,
        name: Name,
        title,
        location: Location,
        experience: Experience,
        education: Education,
        skills: Skills,
        summary: About,
        matchPercentage
      }
    });

    return NextResponse.json({
      success: true,
      candidate: selectedCandidate
    });
  } catch (error: any) {
    console.error("Error saving selected candidate:", error);
    return NextResponse.json(
      { error: "Failed to save candidate" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Find user by email (token)
    const user = await prisma.user.findFirst({
      where: { email: token }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const selectedCandidates = await prisma.selectedCandidate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(selectedCandidates);
  } catch (error: any) {
    console.error("Error fetching selected candidates:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    );
  }
}
