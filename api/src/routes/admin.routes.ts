import { Router } from "express";
import { fetchAllUsers, login, me } from "../controllers/admin.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post('/login', login);
router.get('/me', protect, me);
router.get('/users',protect,fetchAllUsers);

export default router;