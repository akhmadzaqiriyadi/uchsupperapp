"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema, CreateTransactionInput } from "../types";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Organization } from "@/features/organizations/types";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TransactionFormProps {
  organizations: Organization[];
  onSubmit: (data: CreateTransactionInput) => void;
  isLoading?: boolean;
  isSuperAdmin?: boolean;
  defaultOrgId?: string;
}

export function TransactionForm({ 
  organizations, 
  onSubmit, 
  isLoading,
  isSuperAdmin = false,
  defaultOrgId = ""
}: TransactionFormProps) {
  const form = useForm<CreateTransactionInput>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      type: "EXPENSE",
      description: "",
      notes: "",
      amount: 0,
      organizationId: defaultOrgId,
      date: new Date().toISOString().split('T')[0],
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Auto-calculate total from items
  const watchItems = form.watch("items");
  React.useEffect(() => {
    if (watchItems && watchItems.length > 0) {
      const total = watchItems.reduce((sum, item) => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unitPrice) || 0;
        return sum + (qty * price);
      }, 0);
      form.setValue("amount", total);
    }
  }, [watchItems, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: Main Information */}
            <div className="lg:col-span-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField<CreateTransactionInput>
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="INCOME">Income (Pemasukan)</SelectItem>
                            <SelectItem value="EXPENSE">Expense (Pengeluaran)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    
                    {isSuperAdmin && (
                        <FormField<CreateTransactionInput>
                        control={form.control}
                        name="organizationId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Organization</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select organization" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {organizations.map((org) => (
                                    <SelectItem key={org.id} value={org.id}>
                                    {org.slug.toUpperCase()} - {org.name}
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

                <FormField<CreateTransactionInput>
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Total Amount (Rp)</FormLabel>
                    <FormControl>
                        <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        readOnly={fields.length > 0}
                        className={fields.length > 0 ? "bg-muted font-bold" : "font-bold text-lg"}
                        />
                    </FormControl>
                    <FormMessage />
                    {fields.length > 0 && (
                        <p className="text-xs text-muted-foreground">Auto-calculated from items</p>
                    )}
                    </FormItem>
                )}
                />

                <FormField<CreateTransactionInput>
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                        <Input placeholder="Transaction description..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField<CreateTransactionInput>
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(new Date(field.value as string), "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value as string) : undefined}
                                onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField<CreateTransactionInput>
                        control={form.control}
                        name="file"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Attachment</FormLabel>
                            <FormControl>
                                <Input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                    field.onChange(e.target.files ? e.target.files[0] : null);
                                }}
                                name={field.name}
                                ref={field.ref}
                                onBlur={field.onBlur}
                                className="cursor-pointer"
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            {/* RIGHT COLUMN: Items & Details */}
            <div className="lg:col-span-7 space-y-4">
                <Card className="h-full flex flex-col">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Items Breakdown</CardTitle>
                            <CardDescription>Optional detailed list of items</CardDescription>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ itemName: "", quantity: 1, unitPrice: 0 })}
                        >
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto max-h-[400px] space-y-3 p-4 pt-0">
                    {fields.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-md">
                            No items added yet.
                        </div>
                    )}
                    {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start bg-muted/40 p-2 rounded-md">
                        <FormField
                        control={form.control}
                        name={`items.${index}.itemName`}
                        render={({ field }) => (
                            <FormItem className="flex-1">
                            {index === 0 && <FormLabel className="text-xs">Item Name</FormLabel>}
                            <FormControl>
                                <Input placeholder="Item name" {...field} className="bg-background" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field}) => (
                            <FormItem className="w-20">
                            {index === 0 && <FormLabel className="text-xs">Qty</FormLabel>}
                            <FormControl>
                                <Input type="number" placeholder="1" {...field} className="bg-background" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name={`items.${index}.unitPrice`}
                        render={({ field }) => (
                            <FormItem className="w-32">
                            {index === 0 && <FormLabel className="text-xs">Price</FormLabel>}
                            <FormControl>
                                <Input type="number" placeholder="0" {...field} className="bg-background" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={index === 0 ? "mt-6 hover:bg-destructive/10 text-destructive" : "hover:bg-destructive/10 text-destructive"}
                        onClick={() => remove(index)}
                        >
                        <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    ))}
                </CardContent>
                </Card>
            </div>
        </div>

        <FormField<CreateTransactionInput>
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Any additional details..." {...field} value={field.value as string} className="resize-none" rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Separator />
        
        <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isLoading} size="lg" className="w-full md:w-auto px-8">
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                </>
            ) : "Save Transaction"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
