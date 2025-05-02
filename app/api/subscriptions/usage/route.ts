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
    const { usageType, count } = await req.json();

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

    // Check if there's enough usage left
    let currentUsage = 0;
    let maxUsage = 0;

    switch (usageType) {
      case "scraping":
        currentUsage = user.subscription.monthlyUsage;
        maxUsage = user.subscription.package.maxMonthlyScrapes;
        break;
      case "email":
        currentUsage = user.subscription.monthlyEmailUsage;
        maxUsage = user.subscription.package.maxMonthlyEmails;
        break;
      case "candidate":
        currentUsage = user.subscription.monthlyCandidateUsage;
        maxUsage = user.subscription.package.maxCandidateProfiles;
        break;
      default:
        return NextResponse.json({ error: "Invalid usage type" }, { status: 400 });
    }

    if (currentUsage - count < 0) {
      return NextResponse.json({ error: "Usage limit exceeded" }, { status: 400 });
    }

    // Update usage
    const updateData: any = {};
    switch (usageType) {
      case "scraping":
        updateData.monthlyUsage = currentUsage - count;
        break;
      case "email":
        updateData.monthlyEmailUsage = currentUsage - count;
        break;
      case "candidate":
        updateData.monthlyCandidateUsage = currentUsage - count;
        break;
    }

    // Update subscription usage
    await prisma.subscription.update({
      where: {
        id: user.subscription.id
      },
      data: updateData
    });

    return NextResponse.json({ 
      success: true,
      remainingUsage: currentUsage - count
    });

  } catch (error) {
    console.error("[UPDATE_USAGE_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
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

    // Get user's active subscription
    const user = await prisma.user.findFirst({
      where: {
        email: token,
      },
      select: {
        id: true,
        subscription: {
          select: {
            isActive: true,
            monthlyCandidateUsage: true,
            package: {
              select: {
                name: true,
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

    // Return candidates per search based on package
    const candidatesPerSearch = user.subscription.package.name === "Basic" ? 15 : 30;

    return NextResponse.json({
      packageName: user.subscription.package.name,
      candidatesPerSearch,
      remainingUsage: user.subscription.monthlyCandidateUsage
    });

  } catch (error) {
    console.error("[GET_USAGE_LIMITS_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
