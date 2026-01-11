export type UserRole = "client" | "freelancer";

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};
