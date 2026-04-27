export type UserRole = "payer" | "payee";

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};
