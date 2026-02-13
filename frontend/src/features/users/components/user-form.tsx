"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Organization } from "@/features/organizations/types";
import { CreateUserInput, User } from "../types";

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["SUPER_ADMIN", "ADMIN_LINI", "STAFF"]),
  organizationId: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

interface UserFormProps {
  initialData?: User;
  organizations: Organization[];
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  isSuperAdmin?: boolean;
  userOrgId?: string;
}

export function UserForm({ 
    initialData, 
    organizations, 
    onSubmit, 
    isLoading,
    isSuperAdmin,
    userOrgId 
}: UserFormProps) {
    
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      role: initialData?.role || "STAFF",
      organizationId: initialData?.organizationId || userOrgId || "", // Default to user org if not superadmin
      password: "", // Always empty for edit or new
    },
  });

  const handleSubmit = (values: z.infer<typeof userSchema>) => {
      // If editing and password empty, remove it
      const submissionData = { ...values };
      if (!submissionData.password) {
          delete submissionData.password;
      }
      
      // If not superadmin, force org id
      if (!isSuperAdmin && userOrgId) {
          submissionData.organizationId = userOrgId;
      }

      onSubmit(submissionData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} disabled={!!initialData} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {isSuperAdmin && <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>}
                    <SelectItem value="ADMIN_LINI">Line Admin (Kepala Unit)</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />

            {isSuperAdmin && (
                <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                            {org.slug.toUpperCase()}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{initialData ? "New Password (Optional)" : "Password"}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="******" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
