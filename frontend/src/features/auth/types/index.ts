import { z } from "zod";

// --- Domain Models ---
export interface User {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN_LINI" | "STAFF";
  organization?: {
    id: string;
    name: string;
    slug: string;
    isCenter?: boolean;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: string;
}

// --- Validation Schemas ---
export const loginSchema = z.object({
  email: z.string().email({ message: "Email tidak valid" }),
  password: z.string().min(1, { message: "Password wajib diisi" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
