"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import { Modal } from "@/components/ui/modal";

interface ScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
}

export function ScannerModal({ open, onClose, onScan }: ScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  // Keep the latest callback available to the camera loop without restarting it.
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onScanRef.current = onScan;
    onCloseRef.current = onClose;
  }, [onScan, onClose]);

  const handleDecoded = useCallback((decoded: string) => {
    onScanRef.current(decoded);
    onCloseRef.current();
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("Camera is not available in this browser. Paste the link or token instead.");
          return;
        }
        const { Html5Qrcode: Html5QrcodeClass } = await import("html5-qrcode");
        if (cancelled) return;
        scanner = new Html5QrcodeClass("qr-reader-region");
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            if (!cancelled) handleDecoded(decoded);
          },
          () => {
            // Per-frame decode misses are expected; ignore them.
          },
        );
      } catch (caught) {
        if (cancelled) return;
        if (caught instanceof Error && caught.name === "NotAllowedError") {
          setError("Camera permission was denied. Allow camera access or paste the link instead.");
        } else {
          setError("Unable to start the camera. Paste the link or token instead.");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner?.clear())
          .catch(() => {
            // Scanner already stopped.
          });
      }
    };
  }, [open, handleDecoded]);

  return (
    <Modal open={open} onClose={onClose} title="Scan Patient QR Code" description="Align the patient's CareThread QR code within the frame to verify consent.">
      {error ? (
        <p className="text-xs text-danger rounded bg-danger-tint p-3 border border-danger/30">{error}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <div id="qr-reader-region" className="overflow-hidden rounded-input border-2 border-leaf/40 bg-black min-h-[260px] shadow-subtle" />
          <p className="text-[11px] text-muted text-center">Ensure sufficient lighting and keep the code steady.</p>
        </div>
      )}
    </Modal>
  );
}
