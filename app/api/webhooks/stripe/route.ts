import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('[WEBHOOK] Processing subscription:', subscription.id);
  console.log('[WEBHOOK] Metadata:', subscription.metadata);

  const { userId, packageId } = subscription.metadata;

  if (!userId || !packageId) {
    console.error('[WEBHOOK] Missing userId or packageId in metadata');
    throw new Error('Missing required metadata');
  }

  console.log('[WEBHOOK] Creating/updating subscription for user:', userId);

  try {
    // Create or update subscription in our database
    const result = await prisma.subscription.upsert({
      where: {
        userId: userId,
      },
      create: {
        userId: userId,
        packageId: packageId,
        startDate: new Date(),
        isActive: true,
      },
      update: {
        packageId: packageId,
        startDate: new Date(),
        isActive: true,
      },
    });

    console.log('[WEBHOOK] Subscription saved:', result);
    return result;
  } catch (error) {
    console.error('[WEBHOOK] Failed to save subscription:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  console.log('[WEBHOOK] Received webhook request');
  const body = await request.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('[WEBHOOK] Event type:', event.type);
  } catch (err) {
    console.error("[STRIPE_WEBHOOK_ERROR]", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[WEBHOOK] Checkout completed:', session.id);
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await handleSubscriptionCreated(subscription);
        }
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        console.log('[WEBHOOK] Subscription event:', event.type);
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        // Handle subscription cancellation if needed
        break;

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[STRIPE_WEBHOOK_ERROR]", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
