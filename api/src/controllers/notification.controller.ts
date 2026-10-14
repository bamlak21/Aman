import { Response, NextFunction } from "express";
import { AuthReq } from "../types/auth";
import * as notificationService from "../services/notification.service";

export const getNotifications = async (req: AuthReq, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { notifications, unreadCount } = await notificationService.getNotifications(userId);
    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};



export const markAsRead = async (req: AuthReq, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await notificationService.markAsRead(id);
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: AuthReq, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    await notificationService.markAllAsRead(userId);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};
