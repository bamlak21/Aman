import { create } from "zustand";
import type { AuthStore } from "../types/auth";

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
