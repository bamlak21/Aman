import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  getOrCreate,
  getHistory,
  getMyChats,
  getAdminChats,
  getDisputeChatroom,
} from "../controllers/chat.controller";

const router = Router();

router.get("/my", protect, getMyChats);
router.get("/admin", protect, getAdminChats);
router.get("/:disputeId", protect, getOrCreate);
router.get("/:disputeId/room", protect, getDisputeChatroom);
router.get("/room/:chatroomId/messages", protect, getHistory);

export default router;
