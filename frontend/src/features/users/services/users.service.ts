import { api } from "@/lib/axios";
import { UsersResponse, CreateUserInput, UpdateUserInput, User } from "../types";
import { ApiResponse } from "@/types/api";

export const usersService = {
  getUsers: async (params?: any): Promise<UsersResponse> => {
    const response = await api.get<UsersResponse>("/users", { params });
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
      const response = await api.get<ApiResponse<User>>(`/users/${id}`);
      return response.data.data;
  },

  createUser: async (data: CreateUserInput): Promise<User> => {
    // Using Auth Register endpoint for creation
    const response = await api.post<ApiResponse<User>>("/auth/register", data);
    return response.data.data;
  },

  updateUser: async (id: string, data: UpdateUserInput): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  }
};
