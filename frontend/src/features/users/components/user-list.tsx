"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { User } from "../types";
import { Badge } from "@/components/ui/badge";

interface UserListProps {
  data?: {
      data: User[];
      meta: any;
  };
  loading: boolean;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  currentUserId?: string;
}

export function UserList({ data, loading, onEdit, onDelete, currentUserId }: UserListProps) {
  if (loading) {
    return <div className="p-4 text-center">Loading users...</div>;
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Edit className="h-6 w-6 opacity-50" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No users found</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          Start by adding a new user or staff member.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.data.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                  <Badge variant={user.role === "SUPER_ADMIN" ? "default" : user.role === "ADMIN_LINI" ? "secondary" : "outline"}>
                      {user.role}
                  </Badge>
              </TableCell>
              <TableCell>
                  {user.organization ? (
                      <span className="font-mono text-xs">{user.organization.slug.toUpperCase()}</span>
                  ) : "-"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onDelete(user.id)}
                    disabled={user.id === currentUserId}
                    title={user.id === currentUserId ? "Cannot delete yourself" : "Delete user"}
                  >
                    <Trash2 className={`h-4 w-4 ${user.id === currentUserId ? 'text-muted-foreground opacity-50' : 'text-red-500'}`} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
