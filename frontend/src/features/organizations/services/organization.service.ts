import { api } from "@/lib/axios";
import { ApiResponse } from "@/types/api";
import { CreateOrganizationInput, Organization, UpdateOrganizationInput } from "../types";

export const organizationService = {
  getAll: async () => {
    const res = await api.get<ApiResponse<Organization[]>>("/organizations");
    return res.data.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Organization>>(`/organizations/${id}`);
    return res.data.data;
  },

  create: async (data: CreateOrganizationInput) => {
    const res = await api.post<ApiResponse<Organization>>("/organizations", data);
    return res.data.data;
  },

  update: async (id: string, data: UpdateOrganizationInput) => {
    const res = await api.put<ApiResponse<Organization>>(`/organizations/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/organizations/${id}`);
    return res.data;
  },

  uploadLogo: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<ApiResponse<{ url: string }>>(`/organizations/${id}/logo`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.data;
  }
};
