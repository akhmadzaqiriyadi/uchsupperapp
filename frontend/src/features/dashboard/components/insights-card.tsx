"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DashboardInsights } from "../types";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Lightbulb, Clock, ShoppingBag } from "lucide-react";

interface InsightsCardProps {
  data?: DashboardInsights;
  loading: boolean;
}

export function InsightsCard({ data, loading }: InsightsCardProps) {
  if (loading) {
    return (
      <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
           <Skeleton className="h-24 w-full" />
           <Skeleton className="h-24 w-full" />
           <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background border-indigo-100 dark:border-indigo-900/50">
      <CardHeader>
        <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-indigo-500" />
            <CardTitle>Business Insights</CardTitle>
        </div>
        <CardDescription>
            AI-driven analysis of your operational patterns.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-3">
        {/* 1. Peak Times */}
        <div className="bg-white dark:bg-card p-4 rounded-lg shadow-sm border space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Peak Operations</span>
            </div>
            <div>
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {data.timePatterns.busiestDay}
                </div>
                <p className="text-sm font-medium">
                    {data.timePatterns.busiestHour}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Highest transaction volume occurs at this time.
                </p>
            </div>
        </div>

        {/* 2. Ticket Size */}
        <div className="bg-white dark:bg-card p-4 rounded-lg shadow-sm border space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <ShoppingBag className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Avg. Ticket Size</span>
            </div>
            <div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(data.ticketSize.average)}
                </div>
                <p className="text-sm font-medium">
                    Median: {formatCurrency(data.ticketSize.median)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Average value per transaction.
                </p>
            </div>
        </div>

        {/* 3. Recommendations */}
        <div className="bg-white dark:bg-card p-4 rounded-lg shadow-sm border space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Lightbulb className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Smart Recommendations</span>
            </div>
            <ul className="space-y-2">
                {data.recommendation.map((rec, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-indigo-500 mt-1">•</span>
                        <span>{rec}</span>
                    </li>
                ))}
            </ul>
        </div>
      </CardContent>
    </Card>
  );
}
