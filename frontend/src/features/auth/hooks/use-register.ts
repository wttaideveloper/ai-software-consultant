import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth-store";
import { getApiErrorMessage } from "@/utils/api-error";

export function useRegister() {
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authService.register,
    onSuccess: (session) => {
      setSession(session);
      toast.success(`${session.organization.name} is ready. Welcome aboard!`);
      navigate("/", { replace: true });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not create your account."));
    },
  });
}
