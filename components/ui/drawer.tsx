"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { LuX } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: "right" | "left";
  width?: "md" | "lg" | "full";
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = "right",
  width = "md",
}: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay-anim fixed inset-0 z-50 bg-forest-dark/40 backdrop-blur-xs" />
        <Dialog.Content
          className={cn(
            "pointer-events-none fixed inset-y-0 z-50 flex focus:outline-none",
            side === "right" ? "right-0" : "left-0",
          )}
        >
          <div
            className={cn(
              "pointer-events-auto flex h-full w-full flex-col bg-surface shadow-overlay",
              side === "right" ? "drawer-anim border-l border-line" : "drawer-anim-left border-r border-line",
              width === "md" ? "sm:max-w-md" : width === "lg" ? "sm:max-w-lg" : "sm:max-w-xl",
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line bg-app/30 px-6 py-4">
              <div className="min-w-0">
                <Dialog.Title className="truncate text-base font-semibold tracking-tight text-ink">{title}</Dialog.Title>
                {description ? (
                  <Dialog.Description className="mt-0.5 text-xs text-muted leading-relaxed">{description}</Dialog.Description>
                ) : null}
              </div>
              <Dialog.Close
                aria-label="Close"
                className="-m-1 rounded-input p-1 text-muted transition-colors duration-150 hover:bg-mint/40 hover:text-forest-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
              >
                <LuX aria-hidden className="size-4" />
              </Dialog.Close>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer ? (
              <div className="flex items-center justify-end gap-2 border-t border-line bg-app/20 px-6 py-3.5">
                {footer}
              </div>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
