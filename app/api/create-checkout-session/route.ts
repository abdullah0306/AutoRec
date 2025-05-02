import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { SubscriptionPackage } from "@/types/subscription";
import { Package } from "@prisma/client";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
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

    const { packageId, return_url } = await request.json();

    type PackageWithStripe = {
      id: string;
      name: string;
      description: string;
      price: number;
      maxMonthlyScrapes: number;
      maxUrlsPerBatch: number;
      maxPagesPerSite: number;
      concurrentSites: number;
      maxMonthlyEmails: number;
      maxEmailsPerSite: number;
      maxCandidateProfiles: number;
      maxProfilesPerBatch: number;
      stripeProductId: string | null;
      stripePriceId: string | null;
      isActive: boolean;
      createdAt: Date;
    };

    // Get the package details from the database
    const package_ = (await prisma.package.findUnique({

      where: { id: packageId }
    })) as PackageWithStripe | null;

    if (!package_) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    if (!package_.stripePriceId) {
      return NextResponse.json(
        { error: "This package is not available for purchase" },
        { status: 400 }
      );
    }

    // Create a Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: package_.stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/dashboard`,
      cancel_url: `${process.env.NEXTAUTH_URL}/subscribe/${packageId}?canceled=true`,
      customer_email: token,
      metadata: {
        packageId: package_.id,
        userId: user.id,
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("[CREATE_CHECKOUT_SESSION_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
