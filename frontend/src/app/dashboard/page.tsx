"use client";

import { useState } from "react";
import { useDashboardFeed, useDashboardStats, useDashboardChart } from "@/features/dashboard/hooks/use-dashboard";
import { OverviewStats } from "@/features/dashboard/components/overview-stats";
import { RecentActivity } from "@/features/dashboard/components/recent-activity";
import { ReportsChart } from "@/features/dashboard/components/reports-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  const filters = { period };
  
  const { data: stats, isLoading: statsLoading } = useDashboardStats(filters);
  const { data: feed, isLoading: feedLoading } = useDashboardFeed();
  const { data: chartData, isLoading: chartLoading } = useDashboardChart(filters);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
      </div>

      {/* 1. Stats Cards */}
      <OverviewStats stats={stats} loading={statsLoading} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* 2. Main Chart with Period Filter Inside */}
        <div className="col-span-4">
          <ReportsChart 
            data={chartData} 
            loading={chartLoading} 
            period={period}
            onPeriodChange={setPeriod}
          />
        </div>

        {/* 3. Recent Activity Feed */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity logs={feed} loading={feedLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
