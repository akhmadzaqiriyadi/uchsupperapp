"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTransaction, useDeleteTransaction } from "@/features/transactions/hooks/use-transactions";
import { Loader2, ArrowLeft, Trash2, Printer, Calendar, User, Building, FileText, Download, Paperclip, Copy } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import { formatCurrency } from "@/lib/utils";
import { TransactionNota } from "@/features/transactions/components/transaction-nota";

export default function TransactionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    
    // Hooks
    const { data: transaction, isLoading, error } = useTransaction(id);
    const deleteMutation = useDeleteTransaction();

    const [printOptions, setPrintOptions] = useState({
        includeMedia: true,
        includeHeader: true,
        includeFooter: true
    });
    const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync(id);
            toast.success("Transaction deleted successfully");
            router.push("/dashboard/logs");
        } catch (error) {
            toast.error("Failed to delete transaction");
        }
    };

    const handlePrint = () => {
        setIsPrintDialogOpen(false);
        // Delay slightly to allow dialog to close and state to settle if needed
        setTimeout(() => {
            window.print();
        }, 300);
    };

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !transaction) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                <h2 className="text-xl font-semibold text-muted-foreground">Transaction not found</h2>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        );
    }

    const log = transaction; // Alias

    return (
        <>
        <div className="flex flex-col gap-6 p-4 md:p-8 print:hidden">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Transaction Details</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="relative rounded bg-muted/50 px-[0.3rem] py-[0.1rem] font-mono text-xs text-muted-foreground">
                                {log.id}
                            </code>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => {
                                    navigator.clipboard.writeText(log.id);
                                    toast.success("Transaction ID copied to clipboard");
                                }}
                                title="Copy ID"
                            >
                                <Copy className="h-3 w-3 text-muted-foreground" />
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Printer className="mr-2 h-4 w-4" /> Print Nota
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Print Options</DialogTitle>
                                <DialogDescription>Custonize your print output.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="includeHeader" 
                                        checked={printOptions.includeHeader}
                                        onCheckedChange={(checked) => setPrintOptions({...printOptions, includeHeader: checked === true})}
                                    />
                                    <Label htmlFor="includeHeader" className="cursor-pointer">Include Organization Header (Logo & Address)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="includeMedia" 
                                        checked={printOptions.includeMedia}
                                        onCheckedChange={(checked) => setPrintOptions({...printOptions, includeMedia: checked === true})}
                                    />
                                    <Label htmlFor="includeMedia" className="cursor-pointer">Include Attachments / Images</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="includeFooter" 
                                        checked={printOptions.includeFooter}
                                        onCheckedChange={(checked) => setPrintOptions({...printOptions, includeFooter: checked === true})}
                                    />
                                    <Label htmlFor="includeFooter" className="cursor-pointer">Include Footer (Signatures)</Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handlePrint}>Print Now</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the transaction log 
                                and remove the data from our servers.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                Delete
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content (Left) */}
                <div className="flex flex-col gap-6 md:col-span-2">
                    {/* Items Card */}
                    <Card className="overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/5 py-4">
                            <div className="space-y-1">
                                <CardTitle>Items & Services</CardTitle>
                                <CardDescription>Breakdown of this transaction</CardDescription>
                            </div>
                            <Badge variant={log.type === "INCOME" ? "default" : "destructive"} className="px-3 py-1 text-base">
                                {log.type}
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/5 hover:bg-muted/5">
                                        <TableHead className="pl-6">Description</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right pr-6">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {log.items && log.items.length > 0 ? (
                                        log.items.map((item: any) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium pl-6">{item.itemName}</TableCell>
                                                <TableCell className="text-right">{item.quantity}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                                <TableCell className="text-right font-medium pr-6">{formatCurrency(item.subTotal)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                                No specific items listed.
                                                <div className="mt-1 text-sm italic">"{log.description}"</div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter className="flex items-center justify-between bg-muted/5 p-6 border-t">
                            <span className="text-sm font-medium text-muted-foreground">Total Amount</span>
                            <span className="text-2xl font-bold">{formatCurrency(log.totalAmount)}</span>
                        </CardFooter>
                    </Card>

                    {/* Attachments Card */}
                    <Card className="overflow-hidden">
                        <CardHeader className="border-b bg-muted/5 py-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Paperclip className="h-4 w-4" /> Attachments
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {log.attachments && log.attachments.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                    {log.attachments.map((att: any) => (
                                        <div key={att.id} className="relative group overflow-hidden rounded-lg border bg-background">
                                            {att.mimeType?.startsWith("image/") ? (
                                                <div className="aspect-square relative flex items-center justify-center bg-muted/20">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img 
                                                        src={att.url} 
                                                        alt={att.fileName} 
                                                        className="h-full w-full object-contain p-2 transition-transform group-hover:scale-105"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="aspect-square flex flex-col items-center justify-center bg-muted/10 p-4">
                                                    <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                                                    <span className="text-xs text-muted-foreground truncate w-full text-center px-2">{att.fileName}</span>
                                                </div>
                                            )}
                                            
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                                <Button size="sm" variant="secondary" className="shadow-lg" asChild>
                                                    <a href={att.url} target="_blank" rel="noopener noreferrer">
                                                        <Download className="mr-2 h-4 w-4" /> Download
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/5">
                                    <Paperclip className="h-8 w-8 mb-2 opacity-20" />
                                    <p className="text-sm">No attachments uploaded</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info (Right) */}
                <div className="space-y-6 md:col-span-1">
                    <Card className="overflow-hidden">
                        <CardHeader className="border-b bg-muted/5 py-4">
                            <CardTitle className="text-base">Information</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid divide-y">
                                <div className="p-4 space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> Transaction Date
                                    </span>
                                    <p className="font-medium text-sm">
                                        {(() => {
                                            const dateStr = log.transactionDate || log.createdAt;
                                            const date = dateStr ? new Date(dateStr) : null;
                                            if (date && !isNaN(date.getTime())) {
                                                return format(date, "EEEE, dd MMMM yyyy", { locale: idLocale });
                                            }
                                            return "-";
                                        })()}
                                    </p>
                                </div>

                                <div className="p-4 space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                        <User className="h-3 w-3" /> Created By
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                                            {log.user?.name?.charAt(0)}
                                        </div>
                                        <p className="font-medium text-sm">{log.user?.name}</p>
                                    </div>
                                </div>
                                
                                <div className="p-4 space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                        <Building className="h-3 w-3" /> Organization
                                    </span>
                                    <div>
                                        <p className="font-medium text-sm">{log.organization?.slug.toUpperCase()}</p>
                                        <p className="text-xs text-muted-foreground">{log.organization?.name}</p>
                                    </div>
                                </div>

                                <div className="p-4 space-y-1 bg-muted/5">
                                    <span className="text-xs font-medium text-muted-foreground">Description / Notes</span>
                                    <p className="text-sm italic text-muted-foreground">
                                        "{log.description}"
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={`${log.type === "INCOME" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"} overflow-hidden shadow-sm`}>
                         <CardContent className="p-6">
                            <div className="flex flex-col gap-1">
                                <span className={`text-xs font-medium ${log.type === "INCOME" ? "text-green-600" : "text-red-600"} uppercase tracking-wider`}>Net Effect</span>
                                <div className={`text-3xl font-bold ${log.type === "INCOME" ? "text-green-700" : "text-red-700"}`}>
                                    {log.type === "INCOME" ? "+" : "-"}{formatCurrency(log.totalAmount)}
                                </div>
                            </div>
                         </CardContent>
                    </Card>
                </div>
            </div>
        </div>

        {transaction && (
            <TransactionNota transaction={transaction} options={printOptions} />
        )}
        </>
    );
}
