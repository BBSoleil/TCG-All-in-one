import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";
import type { NotificationItem } from "../types";

export async function getUserNotifications(
  userId: string,
  limit = 20,
): Promise<Result<NotificationItem[]>> {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return { success: true, data: notifications };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to fetch notifications"),
    };
  }
}

export async function getUnreadCount(userId: string): Promise<Result<number>> {
  try {
    const count = await prisma.notification.count({
      where: { userId, read: false },
    });
    return { success: true, data: count };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to count notifications"),
    };
  }
}

export async function markAsRead(
  notificationId: string,
  userId: string,
): Promise<Result<void>> {
  try {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to mark as read"),
    };
  }
}

export async function markAllAsRead(userId: string): Promise<Result<void>> {
  try {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to mark all as read"),
    };
  }
}

export async function checkPriceAlerts(): Promise<Result<{ alertsSent: number }>> {
  try {
    // Find all wishlist items with target prices
    const items = await prisma.wishlistCard.findMany({
      where: { targetPrice: { not: null } },
      include: {
        card: { select: { id: true, name: true, marketPrice: true } },
        user: { select: { id: true } },
      },
    });

    let alertsSent = 0;

    for (const item of items) {
      const market = item.card.marketPrice ? Number(item.card.marketPrice) : null;
      const target = item.targetPrice ? Number(item.targetPrice) : null;

      if (market === null || target === null || market > target) continue;

      // Check if we already sent this alert recently (within 24h)
      const recentAlert = await prisma.notification.findFirst({
        where: {
          userId: item.user.id,
          type: "price_alert",
          link: `/cards/${item.card.id}`,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (recentAlert) continue;

      await prisma.notification.create({
        data: {
          userId: item.user.id,
          type: "price_alert",
          title: "Price Alert",
          message: `${item.card.name} is now $${market.toFixed(2)} (your target: $${target.toFixed(2)})`,
          link: `/cards/${item.card.id}`,
        },
      });
      alertsSent++;
    }

    return { success: true, data: { alertsSent } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Price alert check failed"),
    };
  }
}
