"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
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

import { useTransactions, useCreateTransaction, useDeleteTransaction, useRestoreTransaction } from "@/features/transactions/hooks/use-transactions";
import { useOrganizations } from "@/features/organizations/hooks/use-organizations";
import { TransactionList } from "@/features/transactions/components/transaction-list";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { CreateTransactionInput } from "@/features/transactions/types";
import { useDebounce } from "@/hooks/use-debounce";
import { useUser } from "@/features/auth/hooks/use-auth";

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // 1. Get state from URL
  const page = Number(searchParams.get("page")) || 1;
  const typeParam = searchParams.get("type");
  const type = (typeParam === "INCOME" || typeParam === "EXPENSE") ? typeParam : "ALL";
  const targetOrgId = searchParams.get("organizationId") || "ALL";
  const statusParam = searchParams.get("status");
  const status = statusParam === "ARCHIVED" ? "ARCHIVED" : undefined; // New Status
  const urlSearch = searchParams.get("search") || "";

  // 2. Local state for Search Input to handle typing
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Sync debounce to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearch) {
        params.set('search', debouncedSearch);
    } else {
        params.delete('search');
    }
    
    // Only reset page if search actually changed
    if (debouncedSearch !== urlSearch) {
        params.set('page', '1');
        replace(`${pathname}?${params.toString()}`);
    }
  }, [debouncedSearch, replace, pathname, searchParams, urlSearch]);

  // 3. User & Auth Data
  const { data: user } = useUser();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const userOrgId = user?.organization?.id;

  // 4. Fetch Transactions using URL state
  const { data: transactionsData, isLoading: isLogsLoading } = useTransactions({
      page,
      limit: 10,
      search: debouncedSearch,
      type: type === "ALL" ? undefined : type,
      organizationId: targetOrgId === "ALL" ? undefined : targetOrgId,
      status: status // Pass status param
  });
  
  const { data: organizations, isLoading: isOrgsLoading } = useOrganizations();
  
  const createMutation = useCreateTransaction();
  const deleteMutation = useDeleteTransaction();
  const restoreMutation = useRestoreTransaction();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Helper to create filter URLs
  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "ALL" || !value) {
        params.delete(name);
    } else {
        params.set(name, value);
    }
    params.set("page", "1"); // Reset page on filter change
    return `${pathname}?${params.toString()}`;
  };

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handleCreate = async (data: CreateTransactionInput) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success("Transaction log recorded successfully");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Create error:", error);
      toast.error("Failed to create transaction log");
    }
  };

  const handleDelete = async (id: string) => {
    // If we are in ARCHIVED view, deleteMutation might mean "Permanent Delete" or "Restore" depends on logic.
    // For now, let's keep standard delete button behaviour (Archive).
    // If we want RESTORE button, we need to pass logic to TransactionList.
    if (confirm("Are you sure you want to delete this log?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Log archived successfully");
      } catch (error) {
        toast.error("Failed to delete log");
      }
    }
  };

  const handleRestore = async (id: string) => {
    if (confirm("Restore this archived log?")) {
      try {
        await restoreMutation.mutateAsync(id);
        toast.success("Log restored successfully");
      } catch (error) {
        toast.error("Failed to restore log");
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Financial Logs</h2>
            <p className="text-muted-foreground">
                Manage income and expenses across organizations.
            </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} disabled={isOrgsLoading}>
            <Plus className="mr-2 h-4 w-4" /> Record Transaction
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search description..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <Select 
            value={type} 
            onValueChange={(val) => replace(createQueryString("type", val))}
        >
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Type" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
        </Select>

        {isSuperAdmin && (
            <>
                <Select 
                    value={targetOrgId} 
                    onValueChange={(val) => replace(createQueryString("organizationId", val))}
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

                <Select 
                    value={status || "ACTIVE"} 
                    onValueChange={(val) => replace(createQueryString("status", val === "ACTIVE" ? "ALL" : val))}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ACTIVE">Active Data</SelectItem>
                        <SelectItem value="ARCHIVED">Archived (Deleted)</SelectItem>
                    </SelectContent>
                </Select>
            </>
        )}
      </div>
      
      {/* Banner for Archived Mode */}
       {status === "ARCHIVED" && (
          <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 rounded-md flex items-center justify-between shadow-sm" role="alert">
              <div>
                <p className="font-bold">Archive View Mode</p>
                <p className="text-sm">You are viewing deleted records. These items are excluded from financial reports. Restore them if needed.</p>
              </div>
          </div>
       )}

      <TransactionList 
        data={transactionsData?.logs} 
        loading={isLogsLoading} 
        onDelete={handleDelete}
        onRestore={handleRestore}
      />

      {/* Pagination Controls using Link */}
      <div className="flex items-center justify-between border-t py-4">
          <div className="text-sm text-muted-foreground">
              {transactionsData?.meta && (
                <>
                    Page {transactionsData.meta.page} of {transactionsData.meta.totalPages} • Total {transactionsData.meta.total} records
                </>
              )}
          </div>
          <div className="flex items-center gap-2">
            {transactionsData?.meta?.hasPrevPage ? (
                <Button variant="outline" size="sm" asChild>
                    <Link href={createPageURL(page - 1)}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Link>
                </Button>
            ) : (
                <Button variant="outline" size="sm" disabled>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
            )}

            {transactionsData?.meta?.hasNextPage ? (
                <Button variant="outline" size="sm" asChild>
                    <Link href={createPageURL(page + 1)}>
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                </Button>
            ) : (
                <Button variant="outline" size="sm" disabled>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            )}
          </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-4xl lg:max-w-7xl w-full max-h-[95vh] overflow-y-auto">
            <DialogHeader>
            <DialogTitle>Record New Transaction</DialogTitle>
            <DialogDescription>
                Fill in the details below. Attach proof if available.
            </DialogDescription>
            </DialogHeader>
            
            <TransactionForm 
                organizations={organizations || []}
                onSubmit={handleCreate}
                isLoading={createMutation.isPending}
                isSuperAdmin={isSuperAdmin}
                defaultOrgId={userOrgId}
            />
        </DialogContent>
      </Dialog>
    </div>
  );
}
