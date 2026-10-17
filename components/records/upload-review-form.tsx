"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { LuArrowLeft, LuCheck, LuFileText, LuPlus, LuSave, LuTrash2, LuTriangleAlert } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { reviewRecordSchema } from "@/lib/schemas";
import { RECORD_TYPE_LABELS } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormBanner } from "@/components/forms/form-banner";
import type { RecordType } from "@/types";
import { z } from "zod";

type ReviewValues = z.infer<typeof reviewRecordSchema>;

const RECORD_TYPES = Object.entries(RECORD_TYPE_LABELS) as [RecordType, string][];

export interface ReviewDefaults {
  title: string;
  type: string;
  hospital_name: string;
  record_date: string;
  doctor_name: string;
  diagnosis: string;
  remarks: string;
  medications: { name: string; dose: string; frequency: string }[];
  key_values: { label: string; value: string; unit: string }[];
}

interface UploadReviewFormProps {
  defaults: ReviewDefaults;
  confidence: Record<string, number> | null;
  rawText: string | null;
  usedExtraction: boolean;
  file: File | null;
  onBack: () => void;
}

function ConfidenceMark({ confidence, field }: { confidence: Record<string, number> | null; field: string }) {
  const value = confidence?.[field];
  if (value === undefined) return null;
  if (value < 0.7) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-warning-tint px-1.5 py-0.2 text-[10px] font-semibold text-warning border border-warning/30">
        <LuTriangleAlert aria-hidden className="size-3" />
        <span>Verify</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-mint px-1.5 py-0.2 text-[10px] font-semibold text-forest border border-leaf/30">
      <LuCheck aria-hidden className="size-3 text-leaf" />
      <span>{Math.round(value * 100)}%</span>
    </span>
  );
}

function confidenceWarning(confidence: Record<string, number> | null, field: string): string | undefined {
  const value = confidence?.[field];
  return value !== undefined && value < 0.7 ? "AI reading confidence is moderate — please verify accuracy." : undefined;
}

export function UploadReviewForm({
  defaults,
  confidence,
  rawText,
  usedExtraction,
  file,
  onBack,
}: UploadReviewFormProps) {
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewValues>({
    resolver: zodResolver(reviewRecordSchema),
    defaultValues: defaults,
  });

  const medications = useFieldArray({ control, name: "medications" });
  const keyValues = useFieldArray({ control, name: "key_values" });

  const save = useMutation({
    mutationFn: async (values: ReviewValues) => {
      const formData = new FormData();
      formData.set("title", values.title);
      formData.set("type", values.type);
      formData.set("hospital_name", values.hospital_name);
      formData.set("record_date", values.record_date);
      formData.set("doctor_name", values.doctor_name);
      formData.set("diagnosis", values.diagnosis);
      formData.set("remarks", values.remarks);
      formData.set("source", usedExtraction ? "extracted" : "uploaded");
      formData.set(
        "medications",
        JSON.stringify(values.medications.filter((m) => m.name.trim() || m.dose.trim())),
      );
      formData.set(
        "key_values",
        JSON.stringify(values.key_values.filter((k) => k.label.trim() || k.value.trim())),
      );
      if (file) formData.set("file", file);
      return api.patient.uploadRecord(formData);
    },
    onSuccess: () => {
      toast("Medical record saved to your CareThread.");
      router.push("/patient/timeline");
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Could not save the record.", "danger");
    },
  });

  return (
    <Card className="max-w-3xl shadow-card">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              disabled={save.isPending}
              className="rounded-input p-1 text-secondary hover:bg-mint/40 hover:text-forest transition-colors"
              aria-label="Go back to file selection"
            >
              <LuArrowLeft className="size-4" />
            </button>
            <span>Review & Save Clinical Record</span>
          </div>
        }
        description="Verify the extracted clinical fields and add any ongoing medication or lab test parameters."
      />
      <CardBody className="flex flex-col gap-5">
        {usedExtraction ? (
          <div className="flex items-start gap-2.5 rounded-input border border-leaf/30 bg-mint/40 p-3 text-xs leading-relaxed text-forest-dark">
            <LuCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-leaf" />
            <span>
              Details have been automatically extracted from your document. Please review each field below before saving to your medical timeline.
            </span>
          </div>
        ) : null}

        {save.isError ? (
          <FormBanner message={save.error instanceof ApiError ? save.error.message : "Could not save the record."} />
        ) : null}

        <form onSubmit={handleSubmit((values) => save.mutate(values))} className="flex flex-col gap-4.5" noValidate>
          <Field
            id="review-title"
            label="Record Title"
            required
            error={errors.title?.message}
            warning={confidenceWarning(confidence, "title")}
            labelSuffix={<ConfidenceMark confidence={confidence} field="title" />}
          >
            <Input id="review-title" placeholder="E.g., Routine Health Checkup or Blood Glucose Panel" invalid={!!errors.title} {...register("title")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="review-type"
              label="Record Category"
              required
              error={errors.type?.message}
              labelSuffix={<ConfidenceMark confidence={confidence} field="type" />}
            >
              <Select id="review-type" invalid={!!errors.type} {...register("type")}>
                <option value="">Select category</option>
                {RECORD_TYPES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              id="review-date"
              label="Record Date"
              required
              error={errors.record_date?.message}
              warning={confidenceWarning(confidence, "record_date")}
              labelSuffix={<ConfidenceMark confidence={confidence} field="record_date" />}
            >
              <Input id="review-date" type="date" invalid={!!errors.record_date} {...register("record_date")} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="review-hospital"
              label="Hospital or Clinic"
              required
              error={errors.hospital_name?.message}
              warning={confidenceWarning(confidence, "hospital_name")}
              labelSuffix={<ConfidenceMark confidence={confidence} field="hospital_name" />}
            >
              <Input id="review-hospital" placeholder="Apollo Hospital, Fortis, etc." invalid={!!errors.hospital_name} {...register("hospital_name")} />
            </Field>
            <Field
              id="review-doctor"
              label="Doctor / Physician Name"
              required
              error={errors.doctor_name?.message}
              warning={confidenceWarning(confidence, "doctor_name")}
              labelSuffix={<ConfidenceMark confidence={confidence} field="doctor_name" />}
            >
              <Input id="review-doctor" placeholder="Dr. Full Name" invalid={!!errors.doctor_name} {...register("doctor_name")} />
            </Field>
          </div>

          <Field
            id="review-diagnosis"
            label="Diagnosis / Findings"
            error={errors.diagnosis?.message}
            warning={confidenceWarning(confidence, "diagnosis")}
            labelSuffix={<ConfidenceMark confidence={confidence} field="diagnosis" />}
          >
            <Input id="review-diagnosis" placeholder="E.g., Type 2 Diabetes Mellitus, Acute Bronchitis" invalid={!!errors.diagnosis} {...register("diagnosis")} />
          </Field>

          {/* Dynamic Medications Section */}
          <div className="rounded-card border border-line bg-app/30 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-forest-dark">
                Prescribed Medications <span className="font-normal text-muted">(Optional)</span>
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => medications.append({ name: "", dose: "", frequency: "" })}
              >
                <LuPlus aria-hidden className="size-3.5" />
                <span>Add medication</span>
              </Button>
            </div>

            {medications.fields.length === 0 ? (
              <p className="text-xs text-muted">No medications attached to this record.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {medications.fields.map((field, index) => (
                  <li key={field.id} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,110px)_minmax(0,130px)_36px] items-end gap-2 rounded-input border border-line bg-surface p-2.5">
                    <Field id={`rv-med-name-${index}`} label="Medicine Name" className="text-xs">
                      <Input id={`rv-med-name-${index}`} placeholder="Metformin" {...register(`medications.${index}.name`)} />
                    </Field>
                    <Field id={`rv-med-dose-${index}`} label="Dose" className="text-xs">
                      <Input id={`rv-med-dose-${index}`} placeholder="500 mg" {...register(`medications.${index}.dose`)} />
                    </Field>
                    <Field id={`rv-med-freq-${index}`} label="Frequency" className="text-xs">
                      <Input id={`rv-med-freq-${index}`} placeholder="Once daily" {...register(`medications.${index}.frequency`)} />
                    </Field>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-danger-tint hover:text-danger h-9"
                      onClick={() => medications.remove(index)}
                      aria-label={`Remove medication ${index + 1}`}
                    >
                      <LuTrash2 aria-hidden className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Dynamic Key Values Section */}
          <div className="rounded-card border border-line bg-app/30 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-forest-dark">
                Key Clinical & Lab Values <span className="font-normal text-muted">(Optional)</span>
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => keyValues.append({ label: "", value: "", unit: "" })}
              >
                <LuPlus aria-hidden className="size-3.5" />
                <span>Add key value</span>
              </Button>
            </div>

            {keyValues.fields.length === 0 ? (
              <p className="text-xs text-muted">
                No lab parameters added. Add key values for HbA1c, BP, Cholesterol, etc.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {keyValues.fields.map((field, index) => (
                  <li key={field.id} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,90px)_36px] items-end gap-2 rounded-input border border-line bg-surface p-2.5">
                    <Field id={`rv-kv-label-${index}`} label="Test / Parameter" className="text-xs">
                      <Input id={`rv-kv-label-${index}`} placeholder="HbA1c" {...register(`key_values.${index}.label`)} />
                    </Field>
                    <Field id={`rv-kv-value-${index}`} label="Result Value" className="text-xs">
                      <Input id={`rv-kv-value-${index}`} className="font-mono" placeholder="6.4" {...register(`key_values.${index}.value`)} />
                    </Field>
                    <Field id={`rv-kv-unit-${index}`} label="Unit" className="text-xs">
                      <Input id={`rv-kv-unit-${index}`} placeholder="%" {...register(`key_values.${index}.unit`)} />
                    </Field>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-danger-tint hover:text-danger h-9"
                      onClick={() => keyValues.remove(index)}
                      aria-label={`Remove key value ${index + 1}`}
                    >
                      <LuTrash2 aria-hidden className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Field id="review-remarks" label="Additional Remarks / Doctor Instructions">
            <Textarea id="review-remarks" rows={3} placeholder="Dietary instructions, follow-up advice..." {...register("remarks")} />
          </Field>

          {file ? (
            <div className="flex items-center gap-2 rounded-input border border-line bg-surface p-2.5 text-xs text-secondary">
              <LuFileText className="size-4 text-leaf" />
              <span>Attached original file: <span className="font-semibold text-ink">{file.name}</span></span>
            </div>
          ) : null}

          {rawText ? (
            <details className="rounded-input border border-line bg-app p-3">
              <summary className="cursor-pointer select-none text-xs font-semibold text-secondary hover:text-forest transition-colors">
                View raw OCR extracted text
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-5 text-muted bg-surface p-3 rounded border border-line">
                {rawText}
              </pre>
            </details>
          ) : null}

          <div className="flex items-center justify-between border-t border-line pt-4">
            <Button variant="secondary" size="md" onClick={onBack} disabled={save.isPending}>
              Back
            </Button>
            <Button type="submit" size="md" loading={save.isPending} className="gap-2">
              <LuSave aria-hidden className="size-4" />
              <span>Save to CareThread</span>
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
