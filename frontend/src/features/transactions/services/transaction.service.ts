import { api } from "@/lib/axios";
import { ApiResponse } from "@/types/api";
import { CreateTransactionInput, FinancialLog, TransactionFilters } from "../types";

const BASE_URL = "/logs";

export const transactionService = {
  getAll: async (filters?: TransactionFilters) => {
    const res = await api.get<ApiResponse<FinancialLog[]>>(BASE_URL, { params: filters });
    return {
        logs: res.data.data,
        meta: res.data.meta
    };
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<FinancialLog>>(`${BASE_URL}/${id}`);
    return res.data.data;
  },

  create: async (data: CreateTransactionInput) => {
    // 1. Logic Smart Timestamp
    let transactionDate = data.date;
    if (transactionDate) {
        // Cek apakah tanggal yang dipilih adalah Hari Ini
        const now = new Date();
        // data.date format is YYYY-MM-DD
        const [y, m, d] = transactionDate.split('-').map(Number);
        
        if (y === now.getFullYear() && m === now.getMonth() + 1 && d === now.getDate()) {
            // Jika hari ini -> Gunakan jam saat ini
            transactionDate = now.toISOString();
        }
    }
    
    // 2. Create Log Record with items
    const payload: any = {
        type: data.type,
        totalAmount: data.amount,
        description: data.description,
        organizationId: data.organizationId,
        transactionDate: transactionDate,
    };

    // Add items if provided
    if (data.items && data.items.length > 0) {
        payload.items = data.items.map(item => ({
            itemName: item.itemName,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
        }));
    }

    const res = await api.post<ApiResponse<FinancialLog>>(BASE_URL, payload);
    const newLog = res.data.data;

    // 3. Upload Attachment if exists
    if (data.file) {
        try {
            const formData = new FormData();
            formData.append("file", data.file);
            
            await api.post<ApiResponse<any>>(`${BASE_URL}/${newLog.id}/attachments`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        } catch (error) {
            console.error("Failed to upload attachment:", error);
        }
    }

    return newLog;
  },

  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`${BASE_URL}/${id}`);
    return res.data;
  },
  
  update: async (id: string, data: Partial<CreateTransactionInput>) => {
    // Backend PUT /logs/:id expects JSON body
    // File updates are not handled in PUT logs, but via attachments endpoints
    const payload: any = {};
    if (data.type) payload.type = data.type;
    if (data.amount) payload.totalAmount = data.amount;
    if (data.description) payload.description = data.description;
    // transactionDate uneditable in backend PUT currently? Let's check backend.
    
    // Backend Code for PUT /:id line 429: { type, description, totalAmount } only.
    // So organizationId and date are NOT editable via this endpoint.
    
    const res = await api.put<ApiResponse<FinancialLog>>(`${BASE_URL}/${id}`, payload);
    return res.data.data;
  },

  restore: async (id: string) => {
    const res = await api.post<ApiResponse<null>>(`${BASE_URL}/${id}/restore`);
    return res.data;
  }
};
