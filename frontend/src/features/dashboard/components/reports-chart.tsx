"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";
import { ChartDataPoint } from "../types";

interface ReportsChartProps {
    data?: ChartDataPoint[];
    loading: boolean;
    period?: "week" | "month" | "year";
    onPeriodChange?: (period: "week" | "month" | "year") => void;
}

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(142, 76%, 36%)", // Green
  },
  expense: {
    label: "Expense",
    color: "hsl(0, 84%, 60%)", // Red
  },
} satisfies ChartConfig;

export function ReportsChart({ data, loading, period = "month", onPeriodChange }: ReportsChartProps) {
    if (loading) {
        return <div className="h-[350px] w-full bg-muted animate-pulse rounded-md" />;
    }

    const titles = {
        week: "This Week (Daily)",
        month: "This Month (Daily)",
        year: "This Year (Monthly)",
    };

    const descriptions = {
        week: "Daily comparison of Income vs Expenses",
        month: "Daily comparison of Income vs Expenses",
        year: "Monthly comparison of Income vs Expenses",
    };

    const labels = {
        week: "Day",
        month: "Day", 
        year: "Month",
    };

    // Check if data exists and has items
    if (!data || data.length === 0) {
        return (
            <Card className="col-span-4">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{titles[period]}</CardTitle>
                            <CardDescription>{descriptions[period]}</CardDescription>
                        </div>
                        {onPeriodChange && (
                            <Select value={period} onValueChange={(v: any) => onPeriodChange(v)}>
                                <SelectTrigger className="w-[130px] h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="week">This Week</SelectItem>
                                    <SelectItem value="month">This Month</SelectItem>
                                    <SelectItem value="year">This Year</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground">
                        No data available for this period
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-4">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{titles[period]}</CardTitle>
                        <CardDescription>{descriptions[period]}</CardDescription>
                    </div>
                    {onPeriodChange && (
                        <Select value={period} onValueChange={(v: any) => onPeriodChange(v)}>
                            <SelectTrigger className="w-[130px] h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                                <SelectItem value="year">This Year</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                    <BarChart
                        accessibilityLayer
                        data={data}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="period"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => `${(value/1000000).toFixed(1)}M`}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    className="w-[180px]"
                                    labelFormatter={(value) => `${labels[period]}: ${value}`}
                                    formatter={(value) => formatCurrency(value as number)}
                                />
                            }
                        />
                        <Bar
                            dataKey="income"
                            fill="var(--color-income)"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="expense"
                            fill="var(--color-expense)"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
