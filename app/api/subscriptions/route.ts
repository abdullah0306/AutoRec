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
    const data = await req.json();
    const { packageId } = data;

    // Find user by email (token)
    const user = await prisma.user.findFirst({
      where: { email: token },
      include: { subscription: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the package
    const package_ = await prisma.package.findUnique({
      where: { id: packageId }
    });

    if (!package_) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Create or update subscription with package limits
    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        packageId: package_.id,
        startDate: new Date(),
        isActive: true,
        monthlyUsage: package_.maxMonthlyScrapes,
        monthlyEmailUsage: package_.maxMonthlyEmails,
        monthlyCandidateUsage: package_.maxCandidateProfiles,
        lastUsageReset: new Date()
      },
      update: {
        packageId: package_.id,
        startDate: new Date(),
        isActive: true,
        monthlyUsage: package_.maxMonthlyScrapes,
        monthlyEmailUsage: package_.maxMonthlyEmails,
        monthlyCandidateUsage: package_.maxCandidateProfiles,
        lastUsageReset: new Date()
      }
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("[CREATE_SUBSCRIPTION_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Find user by email (token)
    const user = await prisma.user.findFirst({
      where: { email: token },
      include: { subscription: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.subscription) {
      return NextResponse.json({ error: "No active subscription" }, { status: 404 });
    }

    // Cancel subscription by setting isActive to false
    const subscription = await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        isActive: false,
        endDate: new Date()
      }
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("[CANCEL_SUBSCRIPTION_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
