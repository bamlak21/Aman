import { Router } from "express";
import {
  create,
  fundEscrowByPayer,
  getEscrowById,
  getUserAmount,
  getUserEscrows,
  verifyEscrowPayment,
  webhookHandler,
  releaseEscrow,
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
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the transaction
 *         escrowId:
 *           type: string
 *           format: uuid
 *           description: The id of the related escrow
 *         type:
 *           type: string
 *           enum: [deposit, release, refund, fee]
 *           description: The type of transaction
 *         amountCents:
 *           type: number
 *           description: The amount in cents
 *         fromAccount:
 *           type: string
 *           format: uuid
 *           description: The id of the sender
 *         toAccount:
 *           type: string
 *           format: uuid
 *           description: The id of the recipient
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the transaction was created
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
 * /api/escrow/getAmount:
 *   get:
 *     summary: Get total released amount for the authenticated user
 *     description: Retrieve all released transaction amounts for the authenticated user where the escrow status is 'released'
 *     tags: [Escrow]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved total released amount
 *         content:
 *           application/json:
 *             schema:
 *               type: number
 *               example: 10000
 *       403:
 *         description: Forbidden - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An Unauthorized access"
 *                 statusCode:
 *                   type: number
 *                   example: 403
 *       500:
 *         description: Internal Server Error
 */
router.get("/getAmount", protect, getUserAmount);

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
 * /api/escrow/verify-payment:
 *   get:
 *     summary: Verify escrow payment
 *     description: Verify and confirm an escrow payment using the transaction reference
 *     tags: [Escrow]
 *     parameters:
 *       - in: query
 *         name: escrowId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The escrow ID to verify payment for
 *       - in: query
 *         name: tx_ref
 *         required: true
 *         schema:
 *           type: string
 *         description: The transaction reference from Chapa payment
 *     responses:
 *       200:
 *         description: Payment verified and escrow funded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Escrow funded successfully"
 *                 escrow:
 *                   $ref: '#/components/schemas/Escrow'
 *       400:
 *         description: Bad Request - missing escrowId or tx_ref
 *       500:
 *         description: Server error during payment verification
 */
router.get("/verify-payment", verifyEscrowPayment);

/**
 * @swagger
 * /api/escrow/webhook:
 *   post:
 *     summary: Chapa payment webhook
 *     description: Webhook endpoint for Chapa payment gateway to notify payment status updates
 *     tags: [Escrow]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tx_ref
 *               - status
 *             properties:
 *               tx_ref:
 *                 type: string
 *                 description: The transaction reference
 *                 example: "escrow_550e8400-e29b-41d4-a716-446655440000"
 *               status:
 *                 type: string
 *                 description: Payment status from Chapa
 *                 example: "success"
 *               amount:
 *                 type: number
 *                 description: The amount paid
 *     responses:
 *       200:
 *         description: Webhook received
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 */
router.post("/webhook", webhookHandler);



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

/**
 * @swagger
 * /api/escrow/{id}/release:
 *   patch:
 *     summary: Release funds from an escrow transaction
 *     description: Update an escrow status to 'released' and transfer funds to the payee
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
 *         description: The unique identifier of the escrow to release
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Escrow funds successfully released
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Escrow funds released successfully"
 *                 escrow:
 *                   $ref: '#/components/schemas/Escrow'
 *       400:
 *         description: Bad Request - escrow ID is missing, or not in funded status, or expired/already released
 *       401:
 *         description: Bad Request - missing required fields or unauthorized
 *       403:
 *         description: Forbidden - user is not authorized to release this escrow
 *       404:
 *         description: Not Found - escrow or payee not found
 *       500:
 *         description: Internal Server Error
 */
router.patch("/:id/release", protect, releaseEscrow);

export default router;
