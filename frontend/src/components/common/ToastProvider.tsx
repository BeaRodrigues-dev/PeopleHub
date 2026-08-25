import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Alert, Slide, Snackbar, Stack } from "@mui/material";

type ToastSeverity = "success" | "error" | "info" | "warning";
interface Toast { id: number; message: string; severity: ToastSeverity }
interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;

/** Provider global de notificações (feedback de ações: salvar, mover, erro de API, etc.). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((severity: ToastSeverity) => (message: string) => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, message, severity }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ success: push("success"), error: push("error"), info: push("info"), warning: push("warning") }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Stack sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 1600, gap: 1 }}>
        {toasts.map((toast) => (
          <Snackbar
            key={toast.id}
            open
            autoHideDuration={4200}
            onClose={() => remove(toast.id)}
            TransitionComponent={Slide}
            sx={{ position: "static" }}
          >
            <Alert onClose={() => remove(toast.id)} severity={toast.severity} variant="filled" sx={{ borderRadius: 2.5, boxShadow: "0 12px 28px rgba(15,18,32,.18)" }}>
              {toast.message}
            </Alert>
          </Snackbar>
        ))}
      </Stack>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  return ctx;
}
