import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const Icon =
          props.variant === "success"
            ? CheckCircle2
            : props.variant === "destructive" || props.variant === "error"
              ? AlertCircle
              : props.variant === "warning"
                ? AlertTriangle
                : props.variant === "info"
                  ? Info
                  : null;

        return (
          <Toast key={id} {...props}>
            <div className="flex gap-3">
              {Icon && <Icon className="h-5 w-5 shrink-0 mt-0.5" />}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
