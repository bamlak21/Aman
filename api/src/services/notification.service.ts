import { db } from "../config/db";
import { notification } from "../drizzle/schema/notification.schema";
import { desc, eq } from "drizzle-orm";

export const getNotifications = async (userId: string) => {
  const notifications = await db
    .select()
    .from(notification)
    .where(eq(notification.user_id, userId))
    .orderBy(desc(notification.createdAt));
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  return { notifications, unreadCount };
};



export const markAsRead = async (notificationId: string) => {
  const [updated] = await db
    .update(notification)
    .set({ isRead: true })
    .where(eq(notification.id, notificationId))
    .returning();
  return updated;
};

export const markAllAsRead = async (userId: string) => {
  const updated = await db
    .update(notification)
    .set({ isRead: true })
    .where(eq(notification.user_id, userId));
  return updated;
};
