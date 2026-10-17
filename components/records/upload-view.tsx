"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { LuFileText, LuFileUp, LuInfo, LuPenLine, LuSparkles, LuTrash2 } from "react-icons/lu";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { formatBytes, toInputDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FormBanner } from "@/components/forms/form-banner";
import { UploadReviewForm, type ReviewDefaults } from "./upload-review-form";
import { cn } from "@/lib/utils";

const RECORD_TYPE_SUMMARY = "Visits, Prescriptions, Lab reports, Vaccines, Imaging, or Other clinical documents.";

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

function validateFile(file: File): string | null {
  const lower = file.name.toLowerCase();
  const typeOk =
    ["application/pdf", "image/jpeg", "image/png"].includes(file.type) ||
    ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  if (!typeOk) return "Unsupported file type. Please upload a PDF, JPG, or PNG document.";
  if (file.size > MAX_SIZE) return "The selected file exceeds the maximum 10 MB limit.";
  return null;
}

function emptyDefaults(): ReviewDefaults {
  return {
    title: "",
    type: "",
    hospital_name: "",
    record_date: toInputDate(new Date()),
    doctor_name: "",
    diagnosis: "",
    remarks: "",
    medications: [],
    key_values: [],
  };
}

export function UploadView() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Revoke the latest object URL when it is replaced or on unmount.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function acceptFile(next: File) {
    const error = validateFile(next);
    if (error) {
      setFileError(error);
      return;
    }
    setFileError(null);
    setExtractError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(next);
    setPreviewUrl(next.type.startsWith("image/") ? URL.createObjectURL(next) : null);
  }

  function removeFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const [review, setReview] = useState<{
    defaults: ReviewDefaults;
    confidence: Record<string, number> | null;
    rawText: string | null;
    usedExtraction: boolean;
  } | null>(null);

  const extract = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected.");
      const formData = new FormData();
      formData.set("file", file);
      return api.patient.extract(formData);
    },
    onSuccess: (result) => {
      setReview({
        defaults: {
          ...emptyDefaults(),
          title: result.title,
          type: result.type,
          hospital_name: result.hospital_name,
          record_date: /^\d{4}-\d{2}-\d{2}$/.test(result.record_date) ? result.record_date : toInputDate(new Date()),
          doctor_name: result.doctor_name,
          diagnosis: result.diagnosis,
          medications: result.medications.map((m) => ({ name: m.name, dose: m.dose, frequency: m.frequency })),
          key_values: result.key_values.map((k) => ({ label: k.label, value: k.value, unit: k.unit ?? "" })),
        },
        confidence: result.confidence,
        rawText: result.raw_text,
        usedExtraction: true,
      });
    },
    onError: (error) => {
      setExtractError(error instanceof ApiError ? error.message : "Document analysis failed. You can proceed with manual entry.");
    },
  });

  if (review) {
    return (
      <UploadReviewForm
        defaults={review.defaults}
        confidence={review.confidence}
        rawText={review.rawText}
        usedExtraction={review.usedExtraction}
        file={file}
        onBack={() => setReview(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <Card className="shadow-card">
        <CardHeader
          title="Upload Medical Document"
          description="Upload a photo or PDF of your discharge summary, prescription, or lab report. Automated extraction reads values for quick verification."
        />
        <CardBody className="flex flex-col gap-5">
          {fileError ? <FormBanner message={fileError} /> : null}

          {/* Botanical Dropzone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload a file"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const dropped = event.dataTransfer.files?.[0];
              if (dropped) acceptFile(dropped);
            }}
            className={cn(
              "group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed p-8 sm:p-10 text-center transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/25",
              dragging
                ? "border-forest bg-mint/60 scale-[1.01] shadow-leaf"
                : "border-leaf/50 bg-gradient-to-b from-mint/25 to-surface hover:border-leaf hover:bg-mint/35",
            )}
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-mint text-forest shadow-subtle group-hover:scale-110 transition-transform">
              <LuFileUp aria-hidden className="size-6 text-leaf" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-forest-dark">
                Drag and drop your medical file here, or <span className="text-leaf underline">browse files</span>
              </p>
              <p className="mt-1 text-xs text-muted">
                Accepts PDF, JPG, or PNG files up to 10 MB
              </p>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="hidden"
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) acceptFile(selected);
            }}
          />

          {/* Selected File Card */}
          {file ? (
            <div className="flex items-center gap-3.5 rounded-card border border-leaf/40 bg-mint/20 p-3.5 shadow-subtle">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Selected file preview"
                  className="size-12 shrink-0 rounded-input border border-line object-cover shadow-xs"
                />
              ) : (
                <div className="flex size-12 shrink-0 items-center justify-center rounded-input bg-surface border border-line text-forest">
                  <LuFileText aria-hidden className="size-6 text-leaf" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
                <p className="text-xs text-muted">{formatBytes(file.size)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Remove file"
                onClick={removeFile}
                className="text-danger hover:bg-danger-tint hover:text-danger"
              >
                <LuTrash2 aria-hidden className="size-4" />
              </Button>
            </div>
          ) : null}

          {extractError ? <FormBanner message={extractError} /> : null}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <Button
              variant="primary"
              size="md"
              loading={extract.isPending}
              disabled={!file}
              onClick={() => {
                setExtractError(null);
                extract.mutate();
              }}
              className="gap-2"
            >
              <LuSparkles aria-hidden className="size-4 text-accent-fresh" />
              <span>Extract details with AI</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() =>
                setReview({ defaults: emptyDefaults(), confidence: null, rawText: null, usedExtraction: false })
              }
              className="gap-2"
            >
              <LuPenLine aria-hidden className="size-4" />
              <span>Enter details manually</span>
            </Button>
            {extract.isPending ? (
              <p className="text-xs text-forest animate-pulse font-medium">
                Analyzing clinical document... This takes a few seconds.
              </p>
            ) : null}
          </div>

          {/* Verification Notice */}
          <div className="flex items-start gap-2.5 rounded-input border border-info/20 bg-info-tint p-3 text-xs leading-relaxed text-info">
            <LuInfo aria-hidden className="mt-0.5 size-4 shrink-0 text-leaf" />
            <span>
              Automated extraction reads medical dates, hospitals, dosages, and diagnoses. Because documents may be handwritten or varied, always review each extracted field before saving.
            </span>
          </div>
        </CardBody>
      </Card>

      <p className="text-xs text-muted leading-relaxed">
        Supported document categories: <span className="text-secondary font-medium">{RECORD_TYPE_SUMMARY}</span> You can re-categorize at any time during review.
      </p>
    </div>
  );
}
