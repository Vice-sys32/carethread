"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { LuFileText, LuFileUp, LuInfo, LuTrash2 } from "react-icons/lu";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { formatBytes, toInputDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FormBanner } from "@/components/forms/form-banner";
import { UploadReviewForm, type ReviewDefaults } from "./upload-review-form";
import { cn } from "@/lib/utils";

const RECORD_TYPE_SUMMARY = "Visit, Prescription, Lab report, Vaccine, Imaging or Other.";

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

function validateFile(file: File): string | null {
  const lower = file.name.toLowerCase();
  const typeOk = ["application/pdf", "image/jpeg", "image/png"].includes(file.type) || ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  if (!typeOk) return "Unsupported file type. Use PDF, JPG or PNG.";
  if (file.size > MAX_SIZE) return "File exceeds the 10 MB limit.";
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
      setExtractError(error instanceof ApiError ? error.message : "Extraction failed. You can still enter the details manually.");
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
    <div className="flex flex-col gap-5">
      <Card className="max-w-3xl">
        <CardHeader
          title="Select file"
          description="A report photo or PDF. Extraction is optional; details can be entered manually."
        />
        <CardBody className="flex flex-col gap-4">
          {fileError ? <FormBanner message={fileError} /> : null}

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
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line-strong bg-app px-6 py-10 text-center transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              dragging && "border-accent bg-accent-tint",
            )}
          >
            <LuFileUp aria-hidden className="size-6 text-muted" />
            <p className="text-sm font-medium text-ink">Drop the file here or press to browse</p>
            <p className="text-xs text-muted">PDF, JPG or PNG up to 10 MB</p>
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

          {file ? (
            <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Selected file preview" className="size-12 shrink-0 rounded-input border border-line object-cover" />
              ) : (
                <LuFileText aria-hidden className="size-6 shrink-0 text-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{file.name}</p>
                <p className="text-xs text-muted">{formatBytes(file.size)}</p>
              </div>
              <Button variant="ghost" size="sm" aria-label="Remove file" onClick={removeFile}>
                <LuTrash2 aria-hidden className="size-3.5 text-danger" />
              </Button>
            </div>
          ) : null}

          {extractError ? <FormBanner message={extractError} /> : null}

          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <Button loading={extract.isPending} disabled={!file} onClick={() => { setExtractError(null); extract.mutate(); }}>
              Extract details
            </Button>
            <Button
              variant="secondary"
              onClick={() => setReview({ defaults: emptyDefaults(), confidence: null, rawText: null, usedExtraction: false })}
            >
              Enter manually
            </Button>
            {extract.isPending ? <p className="text-[13px] text-muted">Reading the document. This takes a moment.</p> : null}
          </div>

          <div className="flex items-start gap-2 rounded-input border border-info/30 bg-info-tint px-3 py-2.5 text-[13px] leading-5 text-info">
            <LuInfo aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>Extraction is automated and may read values incorrectly. Review every field before saving.</span>
          </div>
        </CardBody>
      </Card>

      <p className="text-xs text-muted">Record type: {RECORD_TYPE_SUMMARY} Choose the closest match; it can be corrected later.</p>
    </div>
  );
}
