import { Router } from "express";
import {
  create,
  fundEscrowByPayer,
  getEscrowById,
  getUserEscrows,
} from "../controllers/escrow.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Escrow:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the escrow
 *         payerId:
 *           type: string
 *           format: uuid
 *           description: The id of the payer
 *         payeeId:
 *           type: string
 *           format: uuid
 *           description: The id of the payee
 *         amountCents:
 *           type: number
 *           description: The amount in cents
 *         releaseCondition:
 *           type: string
 *           enum: [manual, auto_after_date, milestone]
 *           description: The condition for releasing the funds
 *         status:
 *           type: string
 *           enum: [created, funded, released, disputed, cancelled, expired]
 *           description: The current status of the escrow
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: The expiration date of the escrow
 */

/**
 * @swagger
 * tags:
 *   name: Escrow
 *   description: The escrow managing API
 */

/**
 * @swagger
 * /api/escrow/create:
 *   post:
 *     summary: Create a new escrow transaction
 *     tags: [Escrow]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payeeId
 *               - amount
 *               - releaseCondition
 *             properties:
 *               payeeId:
 *                 type: string
 *                 format: uuid
 *                 description: The ID of the user receiving the funds
 *               amount:
 *                 type: number
 *                 minimum: 1
 *                 description: The amount in cents
 *               releaseCondition:
 *                 type: string
 *                 enum: [manual, auto_after_date, milestone]
 *                 description: The condition for releasing funds
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiration date for the escrow
 *     responses:
 *       201:
 *         description: The escrow was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 releaseCondition:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Missing data or invalid input (e.g., payer and payee same, amount <= 0)
 *       401:
 *         description: Unauthorized - Token not provided or invalid
 *       500:
 *         description: Server error
 */
router.post("/create", protect, create);

/**
 * @swagger
 * /api/escrow/{escrowId}:
 *   get:
 *     summary: Get an escrow by ID
 *     description: Retrieve a specific escrow transaction by its unique identifier
 *     tags: [Escrow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: escrowId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the escrow to retrieve
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Escrow successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Success"
 *                 escrow:
 *                   $ref: '#/components/schemas/Escrow'
 *             example:
 *               message: "Success"
 *               escrow:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 amountCents: 10000
 *                 releaseCondition: "manual"
 *                 status: "created"
 *                 expiresAt: "2024-12-31T23:59:59.000Z"
 *       401:
 *         description: Bad Request - escrow ID is missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing Required Fields"
 *                 statusCode:
 *                   type: number
 *                   example: 401
 *       403:
 *         description: Forbidden - user is not authorized to view this escrow
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An authorized access"
 *                 statusCode:
 *                   type: number
 *                   example: 403
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 *                 statusCode:
 *                   type: number
 *                   example: 500
 */
router.get("/:escrowId", protect, getEscrowById);

/**
 * @swagger
 * /api/escrow/:
 *   get:
 *     summary: Get all escrows for the authenticated user
 *     description: Retrieve all escrow transactions where the authenticated user is either the payer or payee
 *     tags: [Escrow]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user's escrows
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Success"
 *                 escrows:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Escrow'
 *             example:
 *               message: "Success"
 *               escrows:
 *                 - id: "550e8400-e29b-41d4-a716-446655440000"
 *                   payerId: "550e8400-e29b-41d4-a716-446655440001"
 *                   payeeId: "550e8400-e29b-41d4-a716-446655440002"
 *                   amountCents: 10000
 *                   releaseCondition: "manual"
 *                   status: "created"
 *                   expiresAt: "2024-12-31T23:59:59.000Z"
 *                 - id: "550e8400-e29b-41d4-a716-446655440003"
 *                   payerId: "550e8400-e29b-41d4-a716-446655440001"
 *                   payeeId: "550e8400-e29b-41d4-a716-446655440004"
 *                   amountCents: 25000
 *                   releaseCondition: "milestone"
 *                   status: "funded"
 *                   expiresAt: null
 *       403:
 *         description: Forbidden - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An authorized access"
 *                 statusCode:
 *                   type: number
 *                   example: 403
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 *                 statusCode:
 *                   type: number
 *                   example: 500
 */
router.get("/", protect, getUserEscrows);

/**
 * @swagger
 * /api/escrow/{id}/fund:
 *   patch:
 *     summary: Fund an escrow transaction
 *     description: Update an escrow status to 'funded' by the payer
 *     tags: [Escrow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the escrow to fund
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Escrow successfully funded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Updated Escrow"
 *                 escrow:
 *                   $ref: '#/components/schemas/Escrow'
 *             example:
 *               message: "Updated Escrow"
 *               escrow:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 amountCents: 10000
 *                 releaseCondition: "manual"
 *                 status: "funded"
 *                 expiresAt: "2024-12-31T23:59:59.000Z"
 *       401:
 *         description: Bad Request - escrow ID is missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing Required Fields"
 *                 statusCode:
 *                   type: number
 *                   example: 401
 *       403:
 *         description: Forbidden - user is not authorized to fund this escrow
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An authorized access"
 *                 statusCode:
 *                   type: number
 *                   example: 403
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 *                 statusCode:
 *                   type: number
 *                   example: 500
 */
router.patch("/:id/fund", protect, fundEscrowByPayer);

export default router;
