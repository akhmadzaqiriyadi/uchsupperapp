import { api } from "@/lib/axios";
import { ApiResponse } from "@/types/api";
import { AuthResponse, LoginInput, User } from "../types";

export const authService = {
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>("/auth/login", data);
    return response.data.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>("/auth/me");
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    // Optional: Call logout endpoint if exists, or just clear local state
    // await api.post("/auth/logout");
  }
};
