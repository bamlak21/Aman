import { api } from "./main";
import type { LoginResponse, RegUser, UserLogin } from "../types/auth";

export async function login(creds: UserLogin): Promise<LoginResponse | void> {
  try {
    const res = await api.post("/auth/login", creds);
    console.log(res);
    console.log(res.data);

    return res.data;
  } catch (error) {
    console.error(error);
  }
}

export async function registerUser(creds: RegUser) {
  try {
    const res = await api.post("/auth/register", creds);
    console.log(res);
    console.log(res.data);
  } catch (error) {
    console.error(error);
  }
}
