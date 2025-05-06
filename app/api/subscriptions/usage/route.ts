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
    const { usageType, count = 0, checkOnly = false } = await req.json();

    // Count is only required when not checking
    if (!checkOnly && !count) {
      return NextResponse.json({ error: "Count is required" }, { status: 400 });
    }

    // Get user's active subscription
    const user = await prisma.user.findFirst({
      where: {
        email: token,
      },
      select: {
        id: true,
        subscription: {
          select: {
            id: true,
            isActive: true,
            monthlyUsage: true,
            monthlyEmailUsage: true,
            monthlyCandidateUsage: true,
            package: {
              select: {
                name: true,
                maxMonthlyScrapes: true,
                maxMonthlyEmails: true,
                maxCandidateProfiles: true
              }
            }
          }
        }
      }
    });

    if (!user?.subscription?.isActive) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    // Get current usage based on type
    let currentUsage = 0;
    let updateField = "";
    
    switch (usageType) {
      case "scraping":
        currentUsage = user.subscription.monthlyUsage;
        updateField = "monthlyUsage";
        break;
      case "email":
        currentUsage = user.subscription.monthlyEmailUsage;
        updateField = "monthlyEmailUsage";
        break;
      case "candidate":
        currentUsage = user.subscription.monthlyCandidateUsage;
        updateField = "monthlyCandidateUsage";
        break;
      default:
        return NextResponse.json({ error: "Invalid usage type" }, { status: 400 });
    }

    // For candidate type, calculate candidatesPerSearch
    const candidatesPerSearch = usageType === 'candidate' ? 
      (user.subscription.package.name === "Basic" ? 15 : 30) : 0;

    // For checkOnly mode, just return current usage and limits
    if (checkOnly) {
      return NextResponse.json({
        success: true,
        packageName: user.subscription.package.name,
        candidatesPerSearch,
        remainingUsage: currentUsage
      });
    }

    // Check if we have enough credits
    if (currentUsage < count) {
      return NextResponse.json({ 
        error: "Not enough credits",
        remainingUsage: currentUsage,
        candidatesPerSearch
      }, { status: 400 });
    }

    // Update the subscription usage directly
    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: user.subscription.id
      },
      data: {
        [updateField]: currentUsage - count
      },
      select: {
        [updateField]: true
      }
    });

    // Return the actual updated usage from the database
    return NextResponse.json({ 
      success: true,
      remainingUsage: updatedSubscription[updateField],
      candidatesPerSearch
    });

  } catch (error) {
    console.error("[UPDATE_USAGE_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

