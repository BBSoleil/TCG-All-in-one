"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../services";

export async function getNotificationsAction() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const result = await getUserNotifications(session.user.id);
  if (!result.success) return { error: result.error.message };

  return { notifications: result.data };
}

export async function getUnreadCountAction() {
  const session = await auth();
  if (!session?.user?.id) return { count: 0 };

  const result = await getUnreadCount(session.user.id);
  return { count: result.success ? result.data : 0 };
}

export async function markAsReadAction(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const result = await markAsRead(notificationId, session.user.id);
  if (!result.success) return { error: result.error.message };

  revalidatePath("/");
  return {};
}

export async function markAllAsReadAction() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const result = await markAllAsRead(session.user.id);
  if (!result.success) return { error: result.error.message };

  revalidatePath("/");
  return {};
}
