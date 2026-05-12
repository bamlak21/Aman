import { api } from "./main";
import type {
  LoginResponse,
  RegResponse,
  RegUser,
  UserLogin,
} from "../types/auth";

export const auth = {
  register: async (input: RegUser): Promise<RegResponse> => {
    const res = await api.post("/api/auth/register", input);
    return res.data;
  },
  login: async (creds: UserLogin): Promise<LoginResponse> => {
    const res = await api.post("/api/auth/login", creds);
    return res.data;
  },
  logout: async (): Promise<void> => {
    await api.post("/api/auth/token/logout");
  },
};
