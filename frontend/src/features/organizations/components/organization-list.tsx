
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Building2, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Organization } from "../types";
import { Skeleton } from "@/components/ui/skeleton";

interface OrganizationListProps {
  data?: Organization[];
  loading: boolean;
  onEdit: (org: Organization) => void;
  onDelete: (id: string) => void;
}

export function OrganizationList({ data, loading, onEdit, onDelete }: OrganizationListProps) {
  if (loading) {
    return (
        <div className="space-y-2">
            {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organization Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((org) => (
            <TableRow key={org.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted overflow-hidden">
                        {org.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={org.logo} alt={org.name} className="h-full w-full object-cover" />
                        ) : (
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span>{org.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{org.id.split('-')[0]}</span>
                    </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-mono">
                  @{org.slug}
                </Badge>
              </TableCell>
              <TableCell>
                {org.isCenter ? (
                    <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">Central Unit</Badge>
                ) : (
                    <Badge variant="secondary">Unit</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => window.location.href = `/dashboard/organizations/${org.id}`}>
                        <Building2 className="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(org)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(org.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {!data?.length && (
            <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                    No organizations found.
                </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
