import { api } from "./main";


export const admin = {
  me: async () => {
    const res = await api.get("/admin/me");

    return res.data;
  },
  users: async () => {
    const res = await api.get("/api/admin/users");
    return res.data;
  }
};
