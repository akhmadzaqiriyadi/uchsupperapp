"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSummary } from "@/features/dashboard/types";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, Activity, Percent } from "lucide-react";

interface BusinessMetricsCardsProps {
  data?: DashboardSummary;
  loading: boolean;
}

export function BusinessMetricsCards({ data, loading }: BusinessMetricsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { overall } = data;
  const profitMargin = overall.profitMargin;
  const isProfit = overall.netBalance >= 0;
  
  // Growth Data
  const growth = overall.growth || { income: 0, expense: 0, netBalance: 0 };
  
  // Expense Ratio
  const expenseRatio = overall.totalIncome > 0 
    ? (overall.totalExpense / overall.totalIncome) * 100 
    : 0;

  // Helper for Growth Indicator
  const renderGrowth = (value: number, invert = false) => {
    // Invert = true implies higher is bad (like expense)
    if (value === 0) return <span className="text-muted-foreground ml-2 text-xs">0%</span>;
    
    const isPositive = value > 0;
    // Determine color: Normally Positive=Good(Green). inverted: Positive=Bad(Red)
    const isGood = invert ? !isPositive : isPositive;
    const colorClass = isGood ? "text-emerald-500" : "text-rose-500";
    const Icon = isPositive ? TrendingUp : TrendingDown;
    
    return (
        <span className={`flex items-center text-xs ml-2 ${colorClass}`}>
            <Icon className="h-3 w-3 mr-1" />
            {Math.abs(value).toFixed(1)}%
        </span>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 1. Net Profit Margin */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end">
             <div className={`text-2xl font-bold ${profitMargin >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {profitMargin.toFixed(1)}%
             </div>
             {/* Profit margin growth could be derived if we had prev margin, but netBalance growth fits better elsewhere */}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {profitMargin >= 30 ? "Healthy margin" : profitMargin > 0 ? "Low margin" : "Loss making"}
          </p>
        </CardContent>
      </Card>

      {/* 2. Net Cash Flow */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end">
              <div className="text-2xl font-bold">
                {formatCurrency(overall.netBalance)}
              </div>
              {renderGrowth(growth.netBalance)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
             vs previous period
          </p>
        </CardContent>
      </Card>

      {/* 3. Expense Ratio */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expense Ratio</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end">
            <div className="text-2xl font-bold">
                {expenseRatio.toFixed(1)}%
            </div>
            {renderGrowth(growth.expense, true)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
             of income spent
          </p>
          <div className="mt-2 h-1 w-full bg-secondary rounded-full overflow-hidden">
             <div 
                className={`h-full ${expenseRatio > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                style={{ width: `${Math.min(expenseRatio, 100)}%` }} 
             />
          </div>
        </CardContent>
      </Card>

      {/* 4. Total Volume */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transaction Vol.</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
           <div className="flex items-end">
              <div className="text-2xl font-bold">
                {overall.totalLogs}
              </div>
              {/* Volume growth not calculated in backend yet, strictly speaking. But let's assume if user asks later we add it. 
                  For now, plain number.
              */}
           </div>
          <p className="text-xs text-muted-foreground mt-1">
             transactions recorded
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
