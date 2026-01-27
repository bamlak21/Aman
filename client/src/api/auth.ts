import { api } from "./main";
import type { LoginResponse, RegUser, UserLogin } from "../types/auth";

export const auth = {
  register: async (creds: RegUser) => {
    const res = await api.post("/auth/register", creds);
    return res.data;
  },
  login: async (creds: UserLogin): Promise<LoginResponse> => {
    const res = await api.post("/auth/login", creds);
    return res.data;
  },
};
