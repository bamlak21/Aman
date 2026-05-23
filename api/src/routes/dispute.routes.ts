import { Router } from "express";
import { create, analyze } from "../controllers/dispute.controller";
import { upload } from "../middleware/multer.middleware";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/create", protect, upload.array("evidence", 1) as any, create);
router.post("/:disputeId/analyze", protect, analyze);

export default router;
