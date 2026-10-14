import { api } from "./main";

export type NotificationItem = {
  id: string;
  escrow_id: string | null;
  dispute_id: string | null;
  user_id: string;
  isRead: boolean;
  text: string;
  type: string;
  createdAt: string;
};

export const notificationApi = {
  getNotifications: async (): Promise<{ notifications: NotificationItem[]; unreadCount: number }> => {
    const res = await api.get("/api/notifications");
    return res.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/api/notifications/${id}/read`);
  },
  markAllAsRead: async (): Promise<void> => {
    await api.patch("/api/notifications/read-all");
  },
};
