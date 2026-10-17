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

const variantClasses = {
  success: {
    border: "border-l-4 border-l-leaf",
    badge: "bg-mint text-forest",
  },
  danger: {
    border: "border-l-4 border-l-danger",
    badge: "bg-danger-tint text-danger",
  },
  info: {
    border: "border-l-4 border-l-forest",
    badge: "bg-mint text-forest",
  },
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
        className="pointer-events-none fixed bottom-5 left-4 right-4 z-[70] flex flex-col items-end gap-2.5 sm:left-auto sm:w-88"
      >
        {items.map((toast) => {
          const Icon = variantIcon[toast.variant];
          const styling = variantClasses[toast.variant];
          return (
            <div
              key={toast.id}
              className={cn(
                "toast-anim pointer-events-auto flex w-full items-start gap-3 rounded-card border border-line bg-surface p-3.5 shadow-overlay",
                styling.border,
              )}
            >
              <div className={cn("mt-0.5 flex size-5 items-center justify-center rounded-full shrink-0", styling.badge)}>
                <Icon aria-hidden className="size-3.5" />
              </div>
              <p className="text-[13px] font-medium leading-5 text-ink">{toast.title}</p>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
