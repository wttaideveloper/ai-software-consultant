import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth-store";
import { getApiErrorMessage } from "@/utils/api-error";

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (session) => {
      setSession(session);
      toast.success(`Welcome back, ${session.user.fullName.split(" ")[0]}.`);
      navigate("/", { replace: true });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Invalid email or password."));
    },
  });
}
