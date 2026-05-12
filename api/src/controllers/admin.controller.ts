import { NextFunction, Request, Response } from "express";
import {
  renewToken,
  revokeToken,
  saveRefreshToken,
  getAdminById,
  getAllUsers,
  fetchAllDispute,
  resolveDisputeService,
  updateDisputeStatusService,
  fetchAllTransactionsService,
  revokeUserAccess,
} from "../services/admin.service";
import { AppError } from "../utils/AppError";
import {
  generateRefreshToken,
  generateToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { JwtPayload } from "../types/auth";
import { authenticateAdmin } from "../services/admin.service";
import { AuthReq } from "../types/auth";
import { createUser, saveUserRefreshToken } from "../services/auth.service";
import { UserRole } from "../types/user";
import { AdminRole } from "../types/admin";



export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;

  if (!email || !password) {
    next(new AppError(401, "Missing Required Fields"));
    return;
  }
  
  try {
    const user = await authenticateAdmin(email, password);
  if(!user) {
    next(new AppError(401, "Invalid Credentials"));
    return;
  }
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await saveRefreshToken(refreshToken, user.id);

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Login successful", admin: user, accessToken });
    return;
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.refresh_token;
  if (!token) {
    next(new AppError(403, "Token missing"));
    return;
  }

  try {
    const payload = verifyRefreshToken(token);

    const tokens = await renewToken(token, payload);

    res.cookie("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken: tokens.accessToken });

    return;
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.refresh_token;

  if (!token) next(new AppError(403, "Token missing"));

  try {
    await revokeToken(token);
    res.clearCookie("refresh_token", { path: "/auth/token" });
    res.sendStatus(204);

    return;
  } catch (error) {
    next(error);
  }
};

export const me = async (
  req: AuthReq,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.id) {
    next(new AppError(401, "Unauthorized"));
    return;
  }

  try {
    const adminUser = await getAdminById(req.user.id);
    res.json(adminUser);
  } catch (error) {
    next(error);
  }
};

export const fetchAllUsers=async(
  req:AuthReq,
  res:Response,
  next:NextFunction
)=>{
 if (!req.user?.id) {
    next(new AppError(401, "Unauthorized"));
    return;
  }
try{
const data = await getAllUsers();

res.status(200).json(data);
}
catch(error){
 next(error);
 return;
}
}

export const addNewUser=async(
  req:AuthReq,
  res:Response,
  next:NextFunction
)=>{

  if(!req.user?.id && req.user?.role!=='super admin'){
    next(new AppError(403,'Unauthorized'))
    return;
  }

  const {name,email,role,password}=req.body;
  if(!name||!email||!role||!password){
   next(new AppError(409,'Missing Field'))
   return;
  }
  try{
 let mappedRole: UserRole | AdminRole;

      if (role === "client") {
        mappedRole = "payer";
      } else if (role === "freelancer") {
        mappedRole = "payee";
      } else if (role === "admin") {
        mappedRole = "admin";
      }
      else {
        next(new AppError(400, "Error"));
        return;
      }

  const newUser= await createUser(name,email,password,mappedRole);
  const payload:JwtPayload ={
    id:newUser.id,
    email:newUser.email,
    role:newUser.role
  }
  
  const accessToken = await generateToken(payload);
  const refreshToken= await generateRefreshToken(payload);
  
  const adminRoles = ["admin", "super admin"];
if (adminRoles.includes(role)) {
  await saveRefreshToken(refreshToken, newUser.id);
} else {
  await saveUserRefreshToken(refreshToken, newUser.id);
}
  
      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 24 * 60 * 60 * 1000,
      });
  
  res.status(201).json({
    message:"success",newUser,accessToken
  })
  return;
}
catch(error){
  console.error(error);
  next(error);
}
}

export const fetchDisputeReports =async(
  req:AuthReq,
  res:Response,
  next:NextFunction  
)=>{

if(!req.user?.id){
  next(new AppError(403,'Unauthorized'))
  return
}

const fetchDispute= await fetchAllDispute();
res.status(200).json(fetchDispute)
}

export const resolveDispute = async(
  req:AuthReq,
  res:Response,
  next:NextFunction  
)=>{
  if(!req.user?.id){
    next(new AppError(403,'Unauthorized'))
    return
  }

  const { disputeId } = req.params;
  const { resolution } = req.body;

  if(!disputeId || !resolution){
    next(new AppError(400,'Missing disputeId or resolution'))
    return
  }

  try{
    const result = await resolveDisputeService(disputeId, resolution);
    res.status(200).json(result);
  }
  catch(error){
    next(error);
  }
}

export const updateDisputeStatus = async(
  req:AuthReq,
  res:Response,
  next:NextFunction  
)=>{
  if(!req.user?.id){
    next(new AppError(403,'Unauthorized'))
    return
  }

  const { disputeId } = req.params;
  const { status } = req.body;

  if(!disputeId || !status){
    next(new AppError(400,'Missing disputeId or status'))
    return
  }

  try{
    const result = await updateDisputeStatusService(disputeId, status);
    res.status(200).json(result);
  }
  catch(error){
    next(error);
  }
}

export const fetchAllTransactions = async(
  req:AuthReq,
  res:Response,
  next:NextFunction
)=>{
  if(!req.user?.id){
    next(new AppError(403,'Unauthorized'))
    return
  }

  try{
    const data = await fetchAllTransactionsService();
    res.status(200).json(data);
  }
  catch(error){
    next(error);
  }
}

export const suspendUser =async (
  req:AuthReq,
  res:Response,
  next:NextFunction
)=>{
  const {userId}= req.params;
  const {isActive}= req.body;

  if(req.user?.role !=="super admin"){
    next(new AppError(401,"Unauthorized"))
    return;
  }
  try{

  const user= await revokeUserAccess(userId,isActive);
  res.status(201).json({message:"Suspend Successfully",user})
  }
   catch(error){
   next(error)
   }
 

}