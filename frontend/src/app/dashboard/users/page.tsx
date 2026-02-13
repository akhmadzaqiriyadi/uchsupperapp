"use client";

import { useState } from "react";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/features/users/hooks/use-users";
import { useOrganizations } from "@/features/organizations/hooks/use-organizations";
import { useUser } from "@/features/auth/hooks/use-auth";
import { UserList } from "@/features/users/components/user-list";
import { UserForm } from "@/features/users/components/user-form";
import { CreateUserInput, User } from "@/features/users/types";
import { useDebounce } from "@/hooks/use-debounce";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [orgFilter, setOrgFilter] = useState<string>("ALL");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  const { data: currentUser } = useUser();
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const { data: usersData, isLoading: isUsersLoading } = useUsers({
      page,
      limit: 10,
      search: debouncedSearch,
      role: roleFilter === "ALL" ? undefined : roleFilter,
      organizationId: orgFilter === "ALL" ? undefined : orgFilter
  });
  
  const { data: organizations } = useOrganizations();
  
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const handleCreate = () => {
      setSelectedUser(null);
      setIsOpen(true);
  };

  const handleEdit = (user: User) => {
      setSelectedUser(user);
      setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("User deleted successfully");
      } catch (error) {
        toast.error("Failed to delete user");
      }
    }
  };

  const handleSubmit = async (data: any) => {
      try {
          if (selectedUser) {
              await updateMutation.mutateAsync({ id: selectedUser.id, data });
              toast.success("User updated successfully");
          } else {
              await createMutation.mutateAsync(data as CreateUserInput);
              toast.success("User created successfully");
          }
          setIsOpen(false);
      } catch (error) {
          console.error(error);
          toast.error("Failed to save user");
      }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground">
                Manage staff and administrators.
            </p>
        </div>
        <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={search}
              onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
              }}
            />
        </div>
        
        {/* Role Filter */}
        <Select 
            value={roleFilter} 
            onValueChange={(val) => {
                setRoleFilter(val);
                setPage(1);
            }}
        >
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Role" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                {isSuperAdmin && <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>}
                <SelectItem value="ADMIN_LINI">Line Admin</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
            </SelectContent>
        </Select>

        {/* Organization Filter (Super Admin Only) */}
        {isSuperAdmin && (
            <Select 
                value={orgFilter} 
                onValueChange={(val) => {
                    setOrgFilter(val);
                    setPage(1);
                }}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter Organization" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Organizations</SelectItem>
                    {organizations?.map(org => (
                        <SelectItem key={org.id} value={org.id}>{org.slug.toUpperCase()}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        )}
      </div>

      <UserList 
        data={usersData} 
        loading={isUsersLoading} 
        onEdit={handleEdit}
        onDelete={handleDelete}
        currentUserId={currentUser?.id}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between border-t py-4">
          <div className="text-sm text-muted-foreground">
              {usersData?.meta && (
                <>
                    Page {usersData.meta.page} of {usersData.meta.totalPages} • Total {usersData.meta.total} records
                </>
              )}
          </div>
          <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!usersData?.meta?.hasPrevPage || isUsersLoading}
            >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!usersData?.meta?.hasNextPage || isUsersLoading}
            >
                Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl">
            <DialogHeader>
            <DialogTitle>{selectedUser ? "Edit User" : "Create New User"}</DialogTitle>
            <DialogDescription>
                {selectedUser ? "Update user details below." : "Add a new user to the system."}
            </DialogDescription>
            </DialogHeader>
            
            <UserForm 
                initialData={selectedUser || undefined}
                organizations={organizations || []}
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending || updateMutation.isPending}
                isSuperAdmin={isSuperAdmin}
                userOrgId={currentUser?.organization?.id}
            />
        </DialogContent>
      </Dialog>
    </div>
  );
}
