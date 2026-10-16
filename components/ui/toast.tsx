"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { LuCheck, LuInfo, LuTriangleAlert } from "react-icons/lu";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "danger" | "info";

interface ToastItem {
  id: number;
  title: string;
  variant: ToastVariant;
}

type PushToast = (title: string, variant?: ToastVariant) => void;

const ToastContext = createContext<PushToast>(() => {});

export function useToast(): PushToast {
  return useContext(ToastContext);
}

const variantIcon = {
  success: LuCheck,
  danger: LuTriangleAlert,
  info: LuInfo,
} as const;

const variantAccent = {
  success: { border: "border-l-success", text: "text-success" },
  danger: { border: "border-l-danger", text: "text-danger" },
  info: { border: "border-l-info", text: "text-info" },
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback<PushToast>((title, variant = "success") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, title, variant }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 left-4 right-4 z-[70] flex flex-col items-end gap-2 sm:left-auto sm:w-80"
      >
        {items.map((toast) => {
          const Icon = variantIcon[toast.variant];
          return (
            <div
              key={toast.id}
              className={cn(
                "toast-anim pointer-events-auto flex w-full items-start gap-2.5 rounded-card border border-l-2 border-line bg-surface p-3 shadow-overlay",
                variantAccent[toast.variant].border,
              )}
            >
              <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", variantAccent[toast.variant].text)} />
              <p className="text-[13px] leading-5 text-ink">{toast.title}</p>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
