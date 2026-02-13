import { z } from "zod";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  isCenter: boolean;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

export const organizationSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric and dashes only"),
    address: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().email("Invalid email").nullable().optional().or(z.literal('')),
    website: z.string().url("Invalid URL").nullable().optional().or(z.literal('')),
    logo: z.string().nullable().optional(),
});

export type CreateOrganizationInput = z.infer<typeof organizationSchema>;
export type UpdateOrganizationInput = Partial<CreateOrganizationInput>;
