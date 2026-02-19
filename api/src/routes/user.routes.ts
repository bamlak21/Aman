import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { searchUserByEmail } from "../controllers/user.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: The user search API
 */

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search users by email
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Email to search for (minimum 3 characters)
 *     responses:
 *       200:
 *         description: List of users matching the email search
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Unauthorized access
 */

router.get("/search", protect, searchUserByEmail);

export default router;
