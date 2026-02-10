import { api } from "./main";

export const user = {
  me: async () => {
    const res = await api.get("/user/me");

    return res.data;
  },
};
