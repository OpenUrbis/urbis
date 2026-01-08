import { useToast as useRadixToast } from "./use-toast";

export const useToast = () => {
  const { toast, dismiss } = useRadixToast();

  const toastSuccess = (message: string, duration?: number) => {
    toast({
      variant: "success",
      title: "Sucesso",
      description: message,
      duration,
    });
  };

  const toastError = (message: string, duration?: number) => {
    toast({
      variant: "error",
      title: "Erro",
      description: message,
      duration,
    });
  };

  const toastInfo = (message: string, duration?: number) => {
    toast({
      variant: "info",
      title: "Informação",
      description: message,
      duration,
    });
  };

  const toastWarning = (message: string, duration?: number) => {
    toast({
      variant: "warning",
      title: "Atenção",
      description: message,
      duration,
    });
  };

  const removeToast = (id: string) => {
    dismiss(id);
  };

  return {
    toastSuccess,
    toastError,
    toastInfo,
    toastWarning,
    removeToast,
  };
};
