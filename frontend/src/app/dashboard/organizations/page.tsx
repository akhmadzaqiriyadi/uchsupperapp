"use client";

import { useOrganizations, useCreateOrganization, useUpdateOrganization, useDeleteOrganization, useUploadOrganizationLogo } from "@/features/organizations/hooks/use-organizations";
import { OrganizationList } from "@/features/organizations/components/organization-list";
import { OrganizationForm } from "@/features/organizations/components/organization-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { CreateOrganizationInput, Organization } from "@/features/organizations/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUser } from "@/features/auth/hooks/use-auth";

export default function OrganizationsPage() {
  const router = useRouter();
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: organizations, isLoading: isOrgLoading } = useOrganizations();
  
  useEffect(() => {
    if (!isUserLoading && user && user.role !== "SUPER_ADMIN") {
        toast.error("You are not authorized to access this page");
        router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);

  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();
  const deleteMutation = useDeleteOrganization();
  const uploadLogoMutation = useUploadOrganizationLogo();
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const handleCreate = () => {
    setSelectedOrg(null);
    setIsOpen(true);
  };

  const handleEdit = (org: Organization) => {
    setSelectedOrg(org);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    // Sonner toast with promise is usually cleaner, but simple approach first
    // Using native confirm for now, better to use Dialog later
    if (confirm("Are you sure you want to delete this organization?")) {
        try {
            await deleteMutation.mutateAsync(id);
            toast.success("Organization deleted successfully");
        } catch (error) {
            toast.error("Failed to delete organization");
        }
    }
  };

  const onSubmit = async (data: CreateOrganizationInput, file?: File) => {
    try {
        let orgId = selectedOrg?.id;

        if (selectedOrg) {
            await updateMutation.mutateAsync({ id: selectedOrg.id, data });
            toast.success("Organization updated successfully");
        } else {
            const newOrg = await createMutation.mutateAsync(data);
            orgId = newOrg.id;
            toast.success("Organization created successfully");
        }

        if (file && orgId) {
            await uploadLogoMutation.mutateAsync({ id: orgId, file });
            toast.success("Logo uploaded successfully");
        }

        setIsOpen(false);
    } catch (error) {
        console.error("Failed to save organization", error);
        toast.error("Failed to save organization");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Organizations</h2>
            <p className="text-muted-foreground">
                Manage business units and departments within UCH.
            </p>
        </div>
        <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Organization
        </Button>
      </div>

      <OrganizationList 
        data={organizations} 
        loading={isOrgLoading} 
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>{selectedOrg ? "Edit Organization" : "Create Organization"}</DialogTitle>
            <DialogDescription>
                {selectedOrg ? "Update organization details below." : "Add a new organization to the system."}
            </DialogDescription>
            </DialogHeader>
            <OrganizationForm 
                initialData={selectedOrg || undefined}
                onSubmit={onSubmit}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </DialogContent>
      </Dialog>
    </div>
  );
}
