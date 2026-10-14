import { Response, NextFunction } from "express";
import {
  createEscrow,
  fetchEscrow,
  fetchEscrows,
  initializeEscrowFunding,
  confirmEscrowFunding, 
  confirmEscrowFundingByTxRef,
  fetchUserAmount,
  releaseFund,
  fetchTransactions,
} from "../services/escrow.service";
import { AuthReq } from "../types/auth";
import { AppError } from "../utils/AppError";
import { findUserByEmail } from "../services/user.service";
import { appFeeCents } from "../utils/fee";

export const create = async (
  req: AuthReq,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  const payerId = req.user?.id;
  const { amount, releaseCondition, expiresAt, milestoneDetails } = req.body;
  const payeeEmail = req.body.payeeEmail;
  
  if (!payeeEmail || !amount || !releaseCondition) {
    next(new AppError(400, "Missing required fields: payeeEmail, amount, releaseCondition"));
    return;
  }

  if (releaseCondition === "milestone" && !milestoneDetails) {
    next(new AppError(400, "Milestone details are required for milestone release condition"));
    return;
  }

  if (releaseCondition === "auto_after_date" && !expiresAt) {
    next(new AppError(400, "Expiration date is required for auto_after_date release condition"));
    return;
  }

  const payee = await findUserByEmail(payeeEmail);
  
  if (!payee) {
    next(new AppError(404, "Payee not found"));
    return;
  }

  const payeeId = payee.id;
  const amountCents = amount * 100;

  if (payeeId === payerId) {
    next(new AppError(400, "Cannot create escrow with yourself"));
    return;
  }

  try {
    if (!payerId) {
      next(new AppError(400, "Missing data"));
      return;
    }
    const escrow = await createEscrow({
      payerId,
      payeeId,
      amountCents,
      releaseCondition,
      expiresAt: releaseCondition==='auto_after_date'?new Date(expiresAt):null,
      milestoneDetails,
    });
    return res.status(201).json({
      id: escrow.id,
      status: escrow.status,
      amount: escrow.amountCents,
      fee: appFeeCents(escrow.amountCents),
      totalToPay: escrow.amountCents + appFeeCents(escrow.amountCents),
      releaseCondition: escrow.releaseCondition,
      expiresAt: escrow.expiresAt,
    });  
  } catch (error) {
    next(error);
  }
};

export const getEscrowById = async (
  req: AuthReq,
  res: Response,
  next: NextFunction,
) => {
  const { escrowId } = req.params;
  
  if (!escrowId || typeof escrowId !== "string") {
    next(new AppError(401, "Missing Required Fields"));
    return;
  }
  const userId = req.user?.id;

  if (!userId) {
    next(new AppError(403, "An authorized access"));
    return;
  }

  try {
    const escrow = await fetchEscrow(escrowId, userId);

    res.status(200).json({
      message: "Success",
      escrow,
    });

    return;
  } catch (error) {
    next(error);
  }
};

export const getUserEscrows = async (
  req: AuthReq,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user?.id;

  if (!userId) {
    next(new AppError(403, "An authorized access"));
    return;
  }

  try {
    const escrows = await fetchEscrows(userId);

    res.status(200).json({
      message: "Success",
      escrows,
    });
    return;
  } catch (error) {
    next(error);
  }
};
export const getUserAmount = async(
  req:AuthReq,
  res:Response,
  next:NextFunction
)=>{
const userId = req.user?.id;
if(!userId){
  next(new AppError(403,"An Unauthorized access"))
  return;
}

try{
  const data = await fetchUserAmount(userId)

res.status(200).json(data)
return;
}
catch(error){
  next(error)
}
}
export const fundEscrowByPayer = async (
  req: AuthReq,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id || !userId || id===undefined) {
    next(new AppError(401, "Missing Required Fields"));
    return;
  }

  try {
    const result = await initializeEscrowFunding(id, userId);

    res.status(200).json({
      message: "Payment initialized",
      tx_ref: result.tx_ref,
      checkout_url: result.checkout_url,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const verifyEscrowPayment = async (
  req: AuthReq,
  res: Response,
  next: NextFunction,
) => {
  const { escrowId, tx_ref } = req.query;
  const userId = req.user?.id
  if(!userId){
    next(new AppError(404,'user not found'))
    return;
  }
  if (!escrowId || !tx_ref || typeof escrowId !== "string" || typeof tx_ref !== "string") {
    next(new AppError(400, "Missing escrowId or tx_ref"));
    return;
  }

  try {
    const escrow = await confirmEscrowFunding(escrowId, tx_ref);

    res.status(200).json({
      message: "Escrow funded successfully",
      escrow,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const webhookHandler = async (
  req: AuthReq,
  res: Response
) => {
  const { tx_ref, status, event } = req.body;
  
  console.log("Chapa Webhook received:", { event, tx_ref, status });

  if (status === "success" && tx_ref) {
    try {
      await confirmEscrowFundingByTxRef(tx_ref);
      console.log(`Escrow funded via webhook for tx_ref ${tx_ref}`);
    } catch (error) {
      console.error("Error confirming escrow funding via webhook:", error);
    }
  }

  res.status(200).json({ received: true });
};

export const releaseEscrow = async (
  req: AuthReq,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id || !userId) {
    next(new AppError(401, "Missing Required Fields"));
    return;
  }

  try {
    const updatedEscrow = await releaseFund(id, userId);

    res.status(200).json({
      message: "Escrow funds released successfully",
      escrow: updatedEscrow,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const fetchUserTxn = async (req:AuthReq,res:Response,next:NextFunction) => {
  const userId = req.user?.id;
  if (!userId) {
    next(new AppError(404, "user not found"));
    return;
  }

  try {
    const fetchTxn = await fetchTransactions(userId)
    res.status(200).json({message:"all transactions fetched",fetchTxn})
    return;
  } catch (error) {
    next(error);
  }
}