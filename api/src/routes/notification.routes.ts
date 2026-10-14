import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.get("/", protect, getNotifications);

router.patch("/:id/read", protect, markAsRead);
router.patch("/read-all", protect, markAllAsRead);

export default router;
