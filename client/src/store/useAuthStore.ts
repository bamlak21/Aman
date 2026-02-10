import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthStore } from "../types/auth";

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: "auth-storage",
    },
  ),
);
