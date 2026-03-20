import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ToastItemProps extends ToastData {
  onRemove: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: "bg-green-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-blue-600 text-white",
  warning: "bg-yellow-500 text-black",
};

export function ToastItem({ id, type, message, duration = 3000, onRemove }: ToastItemProps) {
  const Icon = icons[type];

  useEffect(() => {
    if (duration === Infinity) return;
    
    const timer = setTimeout(() => {
      onRemove(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] max-w-md transition-all animate-in slide-in-from-right fade-in duration-300 pointer-events-auto",
        styles[type]
      )}
      role="alert"
    >
      <Icon className="h-5 w-5 shrink-0" />
      <p className="text-sm font-medium flex-1 break-words">{message}</p>
      <button
        onClick={() => onRemove(id)}
        className="opacity-70 hover:opacity-100 transition-opacity p-1"
        aria-label="Fechar notificação"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
