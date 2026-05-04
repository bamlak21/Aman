import type { AuthStore } from "../types/auth"
import {create} from 'zustand'
import {persist} from 'zustand/middleware'

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      login: (admin, token) => set({ admin, token }),
      logout: () => set({ admin: null, token: null }),
    }),
    {
      name: "auth-storage",
    },
  ),
);