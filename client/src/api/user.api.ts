import { api } from "./main";
export type userEmail = {
  email: string;
}

export const user = {
  me: async () => {
    const res = await api.get("/user/me");

    return res.data;
  },
 
};
