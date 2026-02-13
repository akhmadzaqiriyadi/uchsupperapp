"use client";

import { useState, useEffect } from "react";
import { Download, Loader2, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

import { api } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { SummaryCards } from "@/features/dashboard/components/summary-cards";
import { ReportsChart } from "@/features/dashboard/components/reports-chart";
import { RankingsCard } from "@/features/dashboard/components/rankings-card";
import { DistributionChart } from "@/features/dashboard/components/distribution-chart";
import { BusinessMetricsCards } from "@/features/dashboard/components/business-metrics-cards";
import { InsightsCard } from "@/features/dashboard/components/insights-card";
import { useDashboardSummary, useDashboardChart, useDashboardRankings, useDashboardInsights } from "@/features/dashboard/hooks/use-dashboard";
import { useOrganizations } from "@/features/organizations/hooks/use-organizations";
import { useUser } from "@/features/auth/hooks/use-auth";

export default function ReportsPage() {
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const [period, setPeriod] = useState<"week" | "month" | "year">("month");
    const [orgId, setOrgId] = useState<string>("ALL");
    
    // Export state
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
    });
    const [isExporting, setIsExporting] = useState(false);
    
    // Fetch user to check role
    const { data: user } = useUser();
    const isSuperAdmin = user?.role === "SUPER_ADMIN";

    const filters = {
        period,
        organizationId: orgId === "ALL" ? undefined : orgId,
    };

    const { data: summary, isLoading: isSummaryLoading } = useDashboardSummary(filters);
    const { data: chartData, isLoading: isChartLoading } = useDashboardChart(filters);
    const { data: incomeRankings, isLoading: isIncomeLoading } = useDashboardRankings("INCOME", filters);
    const { data: expenseRankings, isLoading: isExpenseLoading } = useDashboardRankings("EXPENSE", filters);
    const { data: insightsData, isLoading: isInsightsLoading } = useDashboardInsights(filters);
    const { data: organizations } = useOrganizations();

    const handleDownload = async () => {
        if (!date?.from || !date?.to) {
            toast.error("Please select a date range");
            return;
        }

        setIsExporting(true);
        try {
            const startDate = format(date.from, "yyyy-MM-dd");
            const endDate = format(date.to, "yyyy-MM-dd");

            const response = await api.get("/dashboard/export", {
                params: {
                    startDate,
                    endDate,
                    organizationId: orgId === "ALL" ? undefined : orgId
                },
                responseType: "blob"
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `uch-report-${startDate}-to-${endDate}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Report downloaded successfully");
        } catch (e) {
            console.error(e);
            toast.error("Failed to download report");
        } finally {
            setIsExporting(false);
        }
    };

    if (!isMounted) return null;

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Financial Reports</h2>
                    <p className="text-muted-foreground">
                        Overview of financial performance and trends.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {isSuperAdmin && (
                        <Select value={orgId} onValueChange={setOrgId}>
                             <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Organization" />
                             </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="ALL">All Organizations</SelectItem>
                                {organizations?.map(org => (
                                    <SelectItem key={org.id} value={org.id}>{org.slug.toUpperCase()}</SelectItem>
                                ))}
                             </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="reports">Export</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <SummaryCards data={summary} loading={isSummaryLoading} />

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <div className="col-span-4 lg:col-span-7">
                             <ReportsChart 
                                data={chartData} 
                                loading={isChartLoading} 
                                period={period}
                                onPeriodChange={setPeriod}
                             />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    {/* 1. AI Business Insights (Highlighted) */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <InsightsCard data={insightsData} loading={isInsightsLoading} />
                    </div>

                    {/* 2. Business KPI Cards */}
                    <div className="mt-4">
                        <BusinessMetricsCards data={summary} loading={isSummaryLoading} />
                    </div>

                    {/* 3. Top Rankings Lists */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mt-4">
                        <RankingsCard 
                            title="Top Income Sources" 
                            description="Highest revenue generating items"
                            data={incomeRankings}
                            type="INCOME"
                            loading={isIncomeLoading}
                        />
                        <RankingsCard 
                            title="Top Expenses" 
                            description="Highest spending items"
                            data={expenseRankings}
                            type="EXPENSE"
                            loading={isExpenseLoading}
                        />
                    </div>
                    
                    {/* 4. Distribution Charts */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mt-4">
                         <DistributionChart 
                            title="Income Distribution"
                            description="Breakdown of top revenue sources"
                            data={incomeRankings}
                            loading={isIncomeLoading}
                            type="INCOME"
                         />
                         <DistributionChart 
                            title="Expense Distribution"
                            description="Breakdown of top spending items"
                            data={expenseRankings}
                            loading={isExpenseLoading}
                            type="EXPENSE"
                         />
                    </div>
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                    <div className="grid place-items-center h-full py-10">
                        <Card className="w-full max-w-lg">
                            <CardHeader className="text-center">
                                <CardTitle className="text-xl">Export Financial Data</CardTitle>
                                <CardDescription>
                                    Select date range and filtering options to generate a CSV report.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Date Range</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="date"
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !date && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {date?.from ? (
                                                    date.to ? (
                                                        <>
                                                            {format(date.from, "LLL dd, y")} -{" "}
                                                            {format(date.to, "LLL dd, y")}
                                                        </>
                                                    ) : (
                                                        format(date.from, "LLL dd, y")
                                                    )
                                                ) : (
                                                    <span>Pick a date range</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={date?.from}
                                                selected={date}
                                                onSelect={setDate}
                                                numberOfMonths={2}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                
                                {isSuperAdmin && (
                                    <div className="space-y-2">
                                        <Label>Organization</Label>
                                        <Select value={orgId} onValueChange={setOrgId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Organization" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">All Organizations</SelectItem>
                                                {organizations?.map(org => (
                                                    <SelectItem key={org.id} value={org.id}>{org.slug.toUpperCase()}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Leave as "All Organizations" to export global data.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleDownload} disabled={isExporting} className="w-full" size="lg">
                                    {isExporting ? (
                                        <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Generating...</>
                                    ) : (
                                        <><Download className="mr-2 h-4 w-4" /> Download CSV Report</>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
