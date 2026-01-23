import axios from "axios";
import { toast } from "sonner";

interface UseCancelLeaveOptions {
  endpoint: string;
  successMessage: string;
  errorMessage: string;
  onSuccess: () => void;
}

export function useCancelLeave({
  endpoint,
  successMessage,
  errorMessage,
  onSuccess,
}: UseCancelLeaveOptions) {
  const cancelLeave = async (id: string) => {
    try {
      await axios.patch(endpoint, { id });
      toast.success(successMessage);
      onSuccess();
    } catch {
      toast.error(errorMessage);
    }
  };

  return { cancelLeave };
}
