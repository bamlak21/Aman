import { Router } from "express";
import {
  create,
  analyze,
  my,
  listOffers,
  createOffer,
  acceptOffer,
  rejectOffer,
  counterOffer,
} from "../controllers/dispute.controller";
import { upload } from "../middleware/multer.middleware";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.get("/my", protect, my);
router.post("/create", protect, upload.array("evidence", 1) as any, create);
router.post("/:disputeId/analyze", protect, analyze);
router.get("/:disputeId/offers", protect, listOffers);
router.post("/:disputeId/offers", protect, createOffer);
router.post("/offers/:offerId/accept", protect, acceptOffer);
router.post("/offers/:offerId/reject", protect, rejectOffer);
router.post("/offers/:offerId/counter", protect, counterOffer);

export default router;
