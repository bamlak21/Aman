import { Router } from "express";
import { addNewUser, fetchAllUsers, fetchDisputeReports, login, me, resolveDispute, updateDisputeStatus, fetchAllTransactions, suspendUser } from "../controllers/admin.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post('/login', login);
router.get('/me', protect, me);
router.get('/users',protect,fetchAllUsers);
router.post('/newUser',protect,addNewUser);
router.get('/fetch-dispute',protect,fetchDisputeReports);
router.patch('/dispute/:disputeId/resolve',protect,resolveDispute);
router.patch('/dispute/:disputeId/status',protect,updateDisputeStatus);
router.get('/transactions', protect, fetchAllTransactions);
router.patch('/:userId/revoke',protect,suspendUser);

export default router;