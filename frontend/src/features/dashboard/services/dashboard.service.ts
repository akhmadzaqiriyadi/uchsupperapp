import { api } from "@/lib/axios";
import { ApiResponse } from "@/types/api";
import { ChartDataPoint, DashboardSummary, DashboardFilters, RankingItem, DashboardStats, DashboardFeed, DashboardInsights } from "../types";

export const dashboardService = {
  getStats: async (filters?: DashboardFilters) => {
    const params = { organizationId: filters?.organizationId };
    const res = await api.get<ApiResponse<DashboardStats>>("/dashboard/stats", { params });
    return res.data.data;
  },

  getFeed: async (filters?: DashboardFilters) => {
    const params = { organizationId: filters?.organizationId, limit: 5 };
    const res = await api.get<ApiResponse<DashboardFeed>>("/dashboard/feed", { params });
    return res.data.data;
  },

  getSummary: async (filters?: DashboardFilters) => {
    const res = await api.get<ApiResponse<DashboardSummary>>("/dashboard/summary", { params: filters });
    return res.data.data;
  },

  getChartData: async (filters?: DashboardFilters) => {
    const params = { 
      organizationId: filters?.organizationId,
      period: filters?.period 
    };
    const res = await api.get<ApiResponse<ChartDataPoint[]>>("/dashboard/chart", { params });
    return res.data.data;
  },

  getRankings: async (type: "INCOME" | "EXPENSE", filters?: DashboardFilters) => {
    const params = { 
        organizationId: filters?.organizationId,
        type,
        limit: 5 
    };
    const res = await api.get<ApiResponse<RankingItem[]>>("/dashboard/rankings", { params });
    return res.data.data;
  },

  getInsights: async (filters?: DashboardFilters) => {
    const params = {
      organizationId: filters?.organizationId,
    };
    const response = await api.get<ApiResponse<DashboardInsights>>("/dashboard/insights", { params });
    return response.data.data;
  },
};
