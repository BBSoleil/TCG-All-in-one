import { NextResponse } from "next/server";
import { stripe } from "@/shared/lib/stripe";
import { handleSubscriptionChange } from "@/features/billing/services";

const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];

export async function POST(request: Request) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 },
    );
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 },
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      await handleSubscriptionChange(
        subscription.id,
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
        subscription.status,
      );
      break;
    }
  }

  return NextResponse.json({ received: true });
}
