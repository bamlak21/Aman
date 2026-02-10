import { api } from "./main";
import type {
  LoginResponse,
  RegResponse,
  RegUser,
  UserLogin,
} from "../types/auth";

export const auth = {
  register: async (creds: RegUser): Promise<RegResponse> => {
    const res = await api.post("/auth/register", creds);
    return res.data;
  },
  login: async (creds: UserLogin): Promise<LoginResponse> => {
    const res = await api.post("/auth/login", creds);
    return res.data;
  },
  refreshToken: async () => {
    const res = await api.post("/auth/token/refresh");

    return res.data.accessToken;
  },
};
