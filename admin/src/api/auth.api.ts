import { api } from "./main";
import type { LoginResponse, adminLogin } from "../types/auth";

export const auth = {
  login: async (creds: adminLogin): Promise<LoginResponse> => {
    const res = await api.post("api/admin/login", creds);
    return res.data;
  },
};
