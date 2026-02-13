
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RecentLog } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RecentActivityProps {
  logs?: RecentLog[];
  loading: boolean;
}

export function RecentActivity({ logs, loading }: RecentActivityProps) {
  if (loading) {
    return <div className="p-4 text-center">Loading feed...</div>;
  }

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">User</TableHead>
            <TableHead className="text-center min-w-[100px]">Type</TableHead>
            <TableHead className="min-w-[200px]">Description</TableHead>
            {/* Sticky Amount Column */}
            <TableHead className="sticky right-0 bg-card text-right min-w-[140px] shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]">
              Amount
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs?.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="min-w-[180px]">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{log.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                      <span className="text-sm font-medium">{log.user.name}</span>
                      <span className="text-xs text-muted-foreground">{log.organization.slug}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center min-w-[100px]">
                <Badge variant={log.type === "INCOME" ? "default" : "destructive"}>
                  {log.type}
                </Badge>
              </TableCell>
              <TableCell className="py-4 align-middle min-w-[200px]">
                {log.description}
              </TableCell>
              {/* Sticky Amount Cell */}
              <TableCell 
                className={`sticky right-0 bg-card text-right font-bold min-w-[140px] shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)] ${
                  log.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {new Intl.NumberFormat("id-ID", { 
                  style: "currency", 
                  currency: "IDR", 
                  maximumFractionDigits: 0 
                }).format(log.totalAmount)}
              </TableCell>
            </TableRow>
          ))}
          {!logs?.length && (
            <TableRow>
              <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                No recent activity.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
