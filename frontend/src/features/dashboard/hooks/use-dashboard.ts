
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard.service";
import { DashboardSummary, ChartDataPoint, RankingItem, DashboardFilters, DashboardInsights } from "../types";

export const useDashboardSummary = (filters?: DashboardFilters) => {
  return useQuery({
    queryKey: ["dashboard", "summary", filters],
    queryFn: () => dashboardService.getSummary(filters),
  });
};

export const useDashboardChart = (filters?: DashboardFilters) => {
  return useQuery({
    queryKey: ["dashboard", "chart", filters?.organizationId, filters?.period],
    queryFn: () => dashboardService.getChartData(filters),
  });
};

export const useDashboardRankings = (type: "INCOME" | "EXPENSE", filters?: DashboardFilters) => {
  return useQuery({
    queryKey: ["dashboard", "rankings", type, filters?.organizationId],
    queryFn: () => dashboardService.getRankings(type, filters),
  });
};

export const useDashboardInsights = (filters?: DashboardFilters) => {
  return useQuery({
    queryKey: ["dashboard", "insights", filters?.organizationId],
    queryFn: () => dashboardService.getInsights(filters),
  });
};

export const useDashboardStats = (filters?: DashboardFilters) => {
  return useQuery({
    queryKey: ["dashboard", "stats", filters?.organizationId],
    queryFn: () => dashboardService.getStats(filters),
  });
};

export const useDashboardFeed = (filters?: DashboardFilters) => {
  return useQuery({
    queryKey: ["dashboard", "feed", filters?.organizationId],
    queryFn: () => dashboardService.getFeed(filters),
  });
};
