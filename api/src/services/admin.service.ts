import { and, eq} from "drizzle-orm";
import { db } from "../config/db";
import bcrypt from "bcrypt";
import { AppError } from "../utils/AppError";
import { refreshTokens } from "../drizzle/schema/refreshToken.schema";
import { JwtPayload } from "../types/auth";
import { generateRefreshToken, generateToken } from "../utils/jwt";
import { Admin } from "../types/admin";
import { admins} from "../drizzle/schema/admin.schema";
import { dispute } from "../drizzle/schema/dispute.schema";
import { escrow, escrowParties, users } from "../drizzle/schema";




export const authenticateAdmin = async (
  email: string,
  password: string,
): Promise<Admin> => {
  const user = await db.query.admins.findFirst({
    where: eq(admins.email, email),
  });

  if (!user) {
    throw new AppError(401, "prohibited for other users");
  }
  

  const isMatch = await bcrypt.compare(password, user.password);

  if (isMatch)
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  else throw new AppError(401, "Invalid Credentials");
};

export const saveRefreshToken = async (token: string, adminId: string) => {
  if (!token || !adminId) {
    throw new AppError(400, "Missing Required fields");
  }
  await db.insert(refreshTokens).values({
    adminId: adminId,
    token: token,
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  });

  console.log("Refresh token created for: ", adminId);
};

export const renewToken = async (token: string, payload: JwtPayload) => {
  const storedToken = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.token, token),
  });

  if (!storedToken || storedToken.revoked) {
    throw new AppError(403, "Token malformed");
  }

  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.id, storedToken.id));
  const getSignablePayload = (payload: JwtPayload) => {
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
  };
  const newRefreshToken = generateRefreshToken(getSignablePayload(payload));
  const newAccessToken = generateToken(getSignablePayload(payload));

  await db.insert(refreshTokens).values({
    adminId: payload.id,
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const getAdminById = async (id: string): Promise<Admin> => {
  const adminUser = await db.query.admins.findFirst({
    where: eq(admins.id, id),
  });

  if (!adminUser) {
    throw new AppError(404, "Admin not found");
  }

  return {
    id: adminUser.id,
    name: adminUser.name,
    email: adminUser.email,
    role: adminUser.role,
  };
};

export const revokeToken = async (token: string) => {
  const t = await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.token, token))
    .returning();

  return t;
};

export const getAllUsers = async () => {
  return await db.query.users.findMany({
    columns: {
      password: false,
    },
    limit: 12,
  });
};

export const fetchAllDispute =async()=>{

  return await db.query.dispute.findMany();
}

export const resolveDisputeService = async(disputeId:string, resolution:string)=>{
  const [updated] = await db
    .update(dispute)
    .set({ resolution: resolution as any, status: "Resolved", updatedAt: new Date() })
    .where(eq(dispute.id, disputeId))
    .returning();

  if(!updated){
    throw new AppError(404,"Dispute not found");
  }

  return updated;
}

export const updateDisputeStatusService = async(disputeId:string, status:string)=>{
  const [updated] = await db
    .update(dispute)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(dispute.id, disputeId))
    .returning();

  if(!updated){
    throw new AppError(404,"Dispute not found");
  }

  return updated;
}

export const fetchAllTransactionsService = async()=>{
  const allEscrows = await db.select().from(escrow);

  const results = [];

  for (const esc of allEscrows) {
    const parties = await db
      .select({
        userId: escrowParties.userId,
        role: escrowParties.role,
        name: users.name,
        email: users.email,
      })
      .from(escrowParties)
      .innerJoin(users, eq(users.id, escrowParties.userId))
      .where(eq(escrowParties.escrowId, esc.id));

    const payer = parties.find((p) => p.role === "payer");
    const payee = parties.find((p) => p.role === "payee");

    results.push({
      id: esc.id,
      amountCents: esc.amountCents,
      status: esc.status,
      releaseCondition: esc.releaseCondition,
      expiresAt: esc.expiresAt,
      milestoneDetails: esc.milestoneDetails,
      txRef: esc.txRef,
      paidAt: esc.paidAt,
      createdAt: esc.createdAt,
      updatedAt: esc.updatedAt,
      payerName: payer?.name || null,
      payerEmail: payer?.email || null,
      payeeName: payee?.name || null,
      payeeEmail: payee?.email || null,
    });
  }

  return results;
}
export const revokeUserAccess = async(userId:string,isActive:boolean)=>{

  const [update] = await db.update(users)
  .set({isActive:isActive, updatedAt: new Date()})
  .where(eq(users.id,userId))
  .returning()

  if(!update){
   throw new AppError(404,"Not Found");

  }
  const suspendedUser = await db.select().from(users).where(and(eq(users.id,userId),eq(users.isActive,true)))
  
  if(suspendedUser){
    throw new AppError(404,"User already suspended");
  }
  return update;
}