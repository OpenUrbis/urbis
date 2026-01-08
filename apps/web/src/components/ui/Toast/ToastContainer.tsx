import { ToastItem, ToastData } from "./ToastItem";

interface ToastContainerProps {
  toasts: ToastData[];
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none p-4 sm:p-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
