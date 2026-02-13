"use client"

import * as React from "react"
import { ComponentType } from "react"
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RankingItem } from "../types"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface DistributionChartProps {
  title: string;
  description: string;
  data?: RankingItem[];
  loading: boolean;
  type: "INCOME" | "EXPENSE"; // To determine color palette
}

// Professional Palettes
const EXPENSE_COLORS = [
  "#ef4444", // Red 500
  "#f97316", // Orange 500
  "#f59e0b", // Amber 500
  "#eab308", // Yellow 500
  "#84cc16", // Lime 500
];

const INCOME_COLORS = [
  "#10b981", // Emerald 500
  "#06b6d4", // Cyan 500
  "#3b82f6", // Blue 500
  "#6366f1", // Indigo 500
  "#8b5cf6", // Violet 500
];

export function DistributionChart({ title, description, data, loading, type }: DistributionChartProps) {
  const colors = type === "INCOME" ? INCOME_COLORS : EXPENSE_COLORS;

  const chartData = React.useMemo(() => {
    if (!data) return [];
    return data.map((item, index) => ({
      name: item.name,
      value: item.value,
      count: item.count,
      fill: colors[index % colors.length]
    }));
  }, [data, colors]);

  const totalAmount = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  if (loading) {
     return (
        <Card className="flex flex-col h-full">
            <CardHeader className="items-start pb-0">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="flex-1 pb-0 flex items-center justify-center py-6">
                <Skeleton className="h-[200px] w-[200px] rounded-full" />
            </CardContent>
             <CardFooter className="pt-4 items-center justify-center">
                 <Skeleton className="h-4 w-full" />
             </CardFooter>
        </Card>
     )
  }

  if (!data || data.length === 0) {
      return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center min-h-[300px] text-muted-foreground border-dashed border-2 m-4 rounded-lg">
                No data available
            </CardContent>
        </Card>
      );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-start pb-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Chart Section */}
            <div className="h-[250px] w-full relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                         {/* Center Text */}
                         <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground">
                            <tspan x="50%" dy="-0.5em" fontSize="24" fontWeight="bold">
                                {chartData.length}
                            </tspan>
                            <tspan x="50%" dy="1.5em" fontSize="12" fill="#888888">
                                Items
                            </tspan>
                        </text>
                    </PieChart>
                 </ResponsiveContainer>
            </div>

            {/* Custom Legend Section */}
            <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {chartData.map((item, index) => {
                    const percentage = totalAmount > 0 ? ((item.value / totalAmount) * 100).toFixed(1) : 0;
                    return (
                        <div key={index} className="flex items-start gap-2 text-sm">
                            <div 
                                className="w-3 h-3 rounded-full mt-1 shrink-0" 
                                style={{ backgroundColor: item.fill }} 
                            />
                            <div className="flex flex-col w-full">
                                <div className="flex justify-between items-center w-full">
                                    <span className="font-medium text-foreground truncate max-w-[120px]" title={item.name}>
                                        {item.name}
                                    </span>
                                    <span className="font-bold text-foreground">{percentage}%</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-muted-foreground">
                                     <span>{item.count} txns</span>
                                     <span>{formatCurrency(item.value)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm border-t pt-4 bg-muted/20">
        <div className="flex w-full items-center justify-between text-muted-foreground">
          <span>Total {type === 'INCOME' ? 'Revenue' : 'Spending'} (Top 5)</span>
          <span className="font-bold text-foreground">{formatCurrency(totalAmount)}</span>
        </div>
      </CardFooter>
    </Card>
  )
}
