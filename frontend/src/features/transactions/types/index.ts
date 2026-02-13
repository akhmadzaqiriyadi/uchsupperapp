import { z } from "zod";
import { Organization } from "@/features/organizations/types";
import { User } from "@/features/auth/types";

export type TransactionType = "INCOME" | "EXPENSE";

export interface FinancialLog {
  id: string;
  organizationId: string;
  userId: string;
  type: TransactionType;
  totalAmount: number;
  description: string;
  status: string; // 'VERIFIED' | 'PENDING'
  notes?: string | null;
  transactionDate: string;
  createdAt: string;
  deletedAt?: string | null;
  attachmentUrl?: string | null;
  organization: Organization;
  user: User;
  items?: {
    id: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    subTotal: number;
  }[];
  attachments?: {
    id: string;
    fileName: string;
    mimeType: string;
    url: string;
    uploadedAt?: string;
  }[];
}

export interface TransactionFilters {
  organizationId?: string;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  page?: number;
  search?: string;
  status?: "ARCHIVED";
}

// Zod Schema for Form
// File validations handled separately in component usually, but we can add refinement
const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  description: z.string().min(3, "Description is required"),
  organizationId: z.string().min(1, "Organization is required"),
  date: z.string().optional(), // ISO String
  notes: z.string().optional(),
  file: z.any().optional(), // Allow file in schema for form types
  items: z.array(z.object({
    itemName: z.string().min(1, "Item name is required"),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1").optional().default(1),
    unitPrice: z.coerce.number().min(0, "Unit price must be positive"),
  })).optional(),
});

export type CreateTransactionInput = z.infer<typeof transactionSchema>;
