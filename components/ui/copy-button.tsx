"use client";

import { useState } from "react";
import { LuCheck, LuCopy } from "react-icons/lu";
import { useToast } from "./toast";
import { Button, type ButtonSize } from "./button";

interface CopyButtonProps {
  value: string;
  label?: string;
  size?: ButtonSize;
}

export function CopyButton({ value, label = "Copy", size = "sm" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Copy failed. Select the text and copy it manually.", "danger");
    }
  }

  return (
    <Button variant="secondary" size={size} onClick={copy}>
      {copied ? <LuCheck aria-hidden className="size-3.5 text-success" /> : <LuCopy aria-hidden className="size-3.5" />}
      {copied ? "Copied" : label}
    </Button>
  );
}
