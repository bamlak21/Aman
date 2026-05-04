import { Router } from "express";
import { create } from "../controllers/dispute.controller";
import { upload } from "../middleware/multer.middleware";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/create", protect, upload.array("evidence", 1), create);

export default router;
