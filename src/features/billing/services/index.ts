import { prisma } from "@/shared/lib/prisma";
import { stripe } from "@/shared/lib/stripe";
import type { Result } from "@/shared/types";

const PRICE_ID = process.env["STRIPE_MASTER_PRICE_ID"] ?? "";

export async function createCheckoutSession(
  userId: string,
  returnUrl: string,
): Promise<Result<{ url: string }>> {
  if (!stripe) {
    return { success: false, error: new Error("Stripe is not configured") };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, stripeCustomerId: true },
    });
    if (!user) {
      return { success: false, error: new Error("User not found") };
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${returnUrl}?success=true`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: { userId },
    });

    if (!session.url) {
      return { success: false, error: new Error("No checkout URL returned") };
    }

    return { success: true, data: { url: session.url } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to create checkout"),
    };
  }
}

export async function createPortalSession(
  userId: string,
  returnUrl: string,
): Promise<Result<{ url: string }>> {
  if (!stripe) {
    return { success: false, error: new Error("Stripe is not configured") };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return { success: false, error: new Error("No billing account found") };
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    return { success: true, data: { url: session.url } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to create portal session"),
    };
  }
}

export async function handleSubscriptionChange(
  stripeSubscriptionId: string,
  stripeCustomerId: string,
  status: string,
): Promise<void> {
  const tier = status === "active" || status === "trialing" ? "master" : "free";

  await prisma.user.updateMany({
    where: { stripeCustomerId },
    data: {
      subscriptionTier: tier,
      stripeSubscriptionId: stripeSubscriptionId,
    },
  });
}

export async function getUserTier(
  userId: string,
): Promise<Result<{ tier: string }>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });
    return {
      success: true,
      data: { tier: user?.subscriptionTier ?? "free" },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to get tier"),
    };
  }
}
