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
          setError("Camera is not available in this browser. Paste the link instead.");
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
          setError("Unable to start the camera. Paste the link instead.");
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
    <Modal open={open} onClose={onClose} title="Scan QR code" description="Point the camera at the patient's access code.">
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <div id="qr-reader-region" className="overflow-hidden rounded-input border border-line" />
      )}
    </Modal>
  );
}
