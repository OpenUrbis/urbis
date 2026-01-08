import { signal } from "@preact/signals";
import { createContext, ReactNode } from "react";
import { ToastContainer } from "../components/ui/Toast/ToastContainer";
import { ToastData, ToastType } from "../components/ui/Toast/ToastItem";

const toasts = signal<ToastData[]>([]);

export interface ToastContextType {
  toastSuccess: (message: string, duration?: number) => void;
  toastError: (message: string, duration?: number) => void;
  toastInfo: (message: string, duration?: number) => void;
  toastWarning: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const addToast = (type: ToastType, message: string, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    toasts.value = [...toasts.value, { id, type, message, duration }];
  };

  const toastSuccess = (message: string, duration?: number) => addToast("success", message, duration);
  const toastError = (message: string, duration?: number) => addToast("error", message, duration);
  const toastInfo = (message: string, duration?: number) => addToast("info", message, duration);
  const toastWarning = (message: string, duration?: number) => addToast("warning", message, duration);

  const removeToast = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  return (
    <ToastContext.Provider value={{ toastSuccess, toastError, toastInfo, toastWarning, removeToast }}>
      {children}
      <ToastContainer toasts={toasts.value} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};
