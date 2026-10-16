"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { LuX } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md";
}

export function Modal({ open, onClose, title, description, children, size = "sm" }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay-anim fixed inset-0 z-50 bg-ink/40" />
        <Dialog.Content className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none">
          <div
            className={cn(
              "modal-anim pointer-events-auto flex w-full flex-col rounded-card border border-line bg-surface shadow-overlay",
              size === "sm" ? "max-w-sm" : "max-w-md",
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
              <Dialog.Title className="text-sm font-semibold text-ink">{title}</Dialog.Title>
              <Dialog.Close
                aria-label="Close"
                className="-m-1 rounded p-1 text-muted transition-colors duration-150 hover:bg-app hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <LuX aria-hidden className="size-4" />
              </Dialog.Close>
            </div>
            <div className="px-5 py-4">
              {description ? <Dialog.Description className="text-sm text-secondary">{description}</Dialog.Description> : null}
              <div className={description ? "mt-4" : undefined}>{children}</div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
