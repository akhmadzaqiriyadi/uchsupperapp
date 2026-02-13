import { FinancialLog } from "@/features/transactions/types";

export interface ChartDataPoint {
  period: string; // YYYY-MM
  income: number;
  expense: number;
  net: number;
}

export interface DashboardStats {
  scope: string;
  totalOrganizations: number;
  totalUsers: number;
  totalLogs: number;
  today: {
    date: string;
    logsCreated: number;
    totalIncome: number;
    totalExpense: number;
    netChange: number;
  };
}

export type DashboardFeed = FinancialLog[];
export type RecentLog = FinancialLog;


export interface DashboardSummary {
  period: string;
  startDate: string;
  endDate: string;
  scope: string;
  overall: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    profitMargin: number;
    totalLogs: number;
    growth?: {
        income: number;
        expense: number;
        netBalance: number;
    };
  };
  breakdown: Array<{
    id: string;
    name: string;
    slug: string;
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    logCount: number;
  }>;
}

export interface RankingItem {
  name: string;
  value: number;
  count: number;
  avgPrice: number;
}

export interface DashboardInsights {
  timePatterns: {
    busiestDay: string;
    busiestHour: string;
    transactionHeatmap: { days: number[]; hours: number[] };
  };
  ticketSize: {
    average: number;
    median: number;
    min: number;
    max: number;
    distribution: { small: number; medium: number; large: number };
  };
  recommendation: string[];
}

export interface DashboardFilters {
  organizationId?: string;
  period?: "week" | "month" | "year";
}
