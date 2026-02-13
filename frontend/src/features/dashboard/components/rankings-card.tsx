"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { RankingItem } from "../types";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface RankingsCardProps {
  title: string;
  description: string;
  data?: RankingItem[];
  type: "INCOME" | "EXPENSE";
  loading: boolean;
}

export function RankingsCard({ title, description, data, type, loading }: RankingsCardProps) {
  if (loading) {
     return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/3 mb-1" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="pt-4">
                 <div className="space-y-5">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-32" />
                                    <Skeleton className="h-2 w-20" />
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-2 w-16" />
                            </div>
                        </div>
                    ))}
                 </div>
            </CardContent>
        </Card>
     );
  }

  const isIncome = type === "INCOME";
  const bgColor = isIncome ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400";
  const iconColor = isIncome ? "text-emerald-600" : "text-rose-600";
  const Icon = isIncome ? TrendingUp : TrendingDown;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
            <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                    {title}
                </CardTitle>
                <CardDescription className="mt-1">{description}</CardDescription>
            </div>
            {/* Optional: Add export or more options here */}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-4">
        <div className="space-y-6">
          {data?.map((item, index) => (
            <div key={index} className="group flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-transform group-hover:scale-110 ${bgColor}`}>
                    {index + 1}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none line-clamp-1" title={item.name}>
                    {item.name || "Unknown Item"}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {item.count} transactions 
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-1 transition-all group-hover:opacity-100 group-hover:ml-0" />
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums">
                    {formatCurrency(item.value)}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                    Avg: {formatCurrency(item.avgPrice)}
                </p>
              </div>
            </div>
          ))}
          {!data?.length && (
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                  <p>No data available</p>
                  <p className="text-xs opacity-70">Try adjusting the filters</p>
              </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

