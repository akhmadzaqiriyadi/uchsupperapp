
import Link from "next/link";
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
import { MoreHorizontal, Paperclip, FileText, Trash2, Eye, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FinancialLog } from "../types";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface TransactionListProps {
  data?: FinancialLog[];
  loading: boolean;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
}

export function TransactionList({ data, loading, onDelete, onRestore }: TransactionListProps) {
  if (loading) {
    return (
        <div className="space-y-2">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
    )
  }

  return (
    <div className="rounded-md border bg-card text-card-foreground shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-center">Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-center"><Paperclip className="h-4 w-4 mx-auto" /></TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((log) => (
            <TableRow key={log.id} className={log.deletedAt ? "bg-red-50/50 hover:bg-red-50" : ""}>
              <TableCell className="w-[150px]">
                <div className="flex flex-col">
                    <span className="font-medium text-sm">
                        {new Date(log.transactionDate || log.createdAt).toLocaleDateString("id-ID", { 
                            day: 'numeric', 
                            month: 'short', 
                            year: '2-digit',
                            timeZone: 'Asia/Jakarta'
                        })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {new Date(log.transactionDate || log.createdAt).toLocaleTimeString("id-ID", { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            timeZone: 'Asia/Jakarta',
                            timeZoneName: 'short'
                        })}
                    </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{log.organization.slug}</Badge>
              </TableCell>
              <TableCell className="max-w-[300px] truncate" title={log.description}>
                {log.description}
                {log.notes && <div className="text-xs text-muted-foreground italic truncate">{log.notes}</div>}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={log.type === "INCOME" ? "default" : "destructive"}>
                  {log.type}
                </Badge>
              </TableCell>
              <TableCell className={`text-right font-bold ${log.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                {log.type === 'EXPENSE' ? '-' : '+'} {formatCurrency(log.totalAmount)}
              </TableCell>
              <TableCell className="text-center">
                {log.attachmentUrl ? (
                    <Button variant="ghost" size="sm" asChild>
                        <a href={log.attachmentUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4 text-blue-500" />
                        </a>
                    </Button>
                ) : (
                    <span className="text-muted-foreground">-</span>
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
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/logs/${log.id}`} className="cursor-pointer">
                           <div className="flex items-center w-full">
                                <Eye className="mr-2 h-4 w-4" /> View Details
                           </div>
                        </Link>
                    </DropdownMenuItem>
                    
                    {log.deletedAt ? (
                        <DropdownMenuItem className="text-blue-600 focus:text-blue-600 cursor-pointer" onClick={() => onRestore && onRestore(log.id)}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Restore
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" onClick={() => onDelete(log.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {!data?.length && (
            <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No transactions found.
                </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
