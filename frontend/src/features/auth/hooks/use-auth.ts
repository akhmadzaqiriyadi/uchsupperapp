import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "../services/auth.service";
import { LoginInput } from "../types";

import { toast } from "sonner";

export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginInput) => authService.login(data),
    onSuccess: (data) => {
      toast.success("Login successful! Redirecting...");
      
      // Simpan token di Cookie agar bisa dibaca Middleware
      if (typeof window !== "undefined") {
        document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        localStorage.setItem("token", data.token); // Backup local storage
      }
      
      // Invalidasi cache user
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      
      // Redirect ke dashboard
      router.push("/dashboard");
    },
    onError: (error: any) => {
      console.error("Login Failed:", error);
      toast.error(error.response?.data?.error || "Invalid email or password");
    }
  });
};

import { useQuery } from "@tanstack/react-query";

export const useUser = () => {
    return useQuery({
        queryKey: ["auth", "me"],
        queryFn: authService.getMe,
        retry: false,
    });
};
