import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email" })
    .trim()
    .toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(3, "Name too short").max(15),
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email" })
    .trim()
    .toLowerCase(),

  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["client", "freelancer", "admin"], {
    message: "Please select a valid role",
  }),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
