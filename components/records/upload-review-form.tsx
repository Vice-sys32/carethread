"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { LuPlus, LuTrash2, LuTriangleAlert } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { reviewRecordSchema } from "@/lib/schemas";
import { RECORD_TYPE_LABELS } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
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
  if (value === undefined || value >= 0.7) return null;
  return <LuTriangleAlert aria-hidden className="size-3.5 text-warning" />;
}

function confidenceWarning(confidence: Record<string, number> | null, field: string): string | undefined {
  const value = confidence?.[field];
  return value !== undefined && value < 0.7 ? "Check this value" : undefined;
}

export function UploadReviewForm({ defaults, confidence, rawText, usedExtraction, file, onBack }: UploadReviewFormProps) {
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
      toast("Record saved.");
      router.push("/patient/timeline");
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Could not save the record.", "danger");
    },
  });

  return (
    <Card className="max-w-3xl">
      <CardBody className="flex flex-col gap-4">
        {usedExtraction ? (
          <div className="flex items-start gap-2 rounded-input border border-info/30 bg-info-tint px-3 py-2.5 text-[13px] leading-5 text-info">
            <LuTriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>Extracted values must be verified before saving.</span>
          </div>
        ) : null}

        {save.isError ? (
          <FormBanner message={save.error instanceof ApiError ? save.error.message : "Could not save the record."} />
        ) : null}

        <form onSubmit={handleSubmit((values) => save.mutate(values))} className="flex flex-col gap-4" noValidate>
          <Field
            id="review-title"
            label="Title"
            required
            error={errors.title?.message}
            warning={confidenceWarning(confidence, "title")}
            labelSuffix={<ConfidenceMark confidence={confidence} field="title" />}
          >
            <Input id="review-title" invalid={!!errors.title} {...register("title")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="review-type"
              label="Record type"
              required
              error={errors.type?.message}
              labelSuffix={<ConfidenceMark confidence={confidence} field="type" />}
            >
              <Select id="review-type" invalid={!!errors.type} {...register("type")}>
                <option value="">Select</option>
                {RECORD_TYPES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              id="review-date"
              label="Record date"
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
              label="Hospital or clinic"
              required
              error={errors.hospital_name?.message}
              warning={confidenceWarning(confidence, "hospital_name")}
              labelSuffix={<ConfidenceMark confidence={confidence} field="hospital_name" />}
            >
              <Input id="review-hospital" invalid={!!errors.hospital_name} {...register("hospital_name")} />
            </Field>
            <Field
              id="review-doctor"
              label="Doctor name"
              required
              error={errors.doctor_name?.message}
              warning={confidenceWarning(confidence, "doctor_name")}
              labelSuffix={<ConfidenceMark confidence={confidence} field="doctor_name" />}
            >
              <Input id="review-doctor" invalid={!!errors.doctor_name} {...register("doctor_name")} />
            </Field>
          </div>

          <Field
            id="review-diagnosis"
            label="Diagnosis"
            error={errors.diagnosis?.message}
            warning={confidenceWarning(confidence, "diagnosis")}
            labelSuffix={<ConfidenceMark confidence={confidence} field="diagnosis" />}
          >
            <Input id="review-diagnosis" invalid={!!errors.diagnosis} {...register("diagnosis")} />
          </Field>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-secondary">
              Medications <span className="font-normal text-muted">(optional)</span>
            </span>
            {medications.fields.length === 0 ? (
              <p className="text-[13px] text-muted">No medications added.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {medications.fields.map((field, index) => (
                  <li key={field.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,110px)_minmax(0,130px)_36px] items-end gap-2">
                    <Field id={`rv-med-name-${index}`} label={index === 0 ? "Name" : undefined} className={index === 0 ? "" : "-mt-6"}>
                      <Input id={`rv-med-name-${index}`} {...register(`medications.${index}.name`)} />
                    </Field>
                    <Field id={`rv-med-dose-${index}`} label={index === 0 ? "Dose" : undefined} className={index === 0 ? "" : "-mt-6"}>
                      <Input id={`rv-med-dose-${index}`} {...register(`medications.${index}.dose`)} />
                    </Field>
                    <Field id={`rv-med-freq-${index}`} label={index === 0 ? "Frequency" : undefined} className={index === 0 ? "" : "-mt-6"}>
                      <Input id={`rv-med-freq-${index}`} {...register(`medications.${index}.frequency`)} />
                    </Field>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mb-0.5 text-danger hover:bg-danger-tint hover:text-danger"
                      onClick={() => medications.remove(index)}
                      aria-label={`Remove medication ${index + 1}`}
                    >
                      <LuTrash2 aria-hidden className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={() => medications.append({ name: "", dose: "", frequency: "" })}
            >
              <LuPlus aria-hidden className="size-3.5" />
              Add medication
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-secondary">
              Key values <span className="font-normal text-muted">(optional)</span>
            </span>
            {keyValues.fields.length === 0 ? (
              <p className="text-[13px] text-muted">No key values added. Use them for lab values such as HbA1c or blood pressure.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {keyValues.fields.map((field, index) => (
                  <li key={field.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,90px)_36px] items-end gap-2">
                    <Field id={`rv-kv-label-${index}`} label={index === 0 ? "Label" : undefined} className={index === 0 ? "" : "-mt-6"}>
                      <Input id={`rv-kv-label-${index}`} {...register(`key_values.${index}.label`)} />
                    </Field>
                    <Field id={`rv-kv-value-${index}`} label={index === 0 ? "Value" : undefined} className={index === 0 ? "" : "-mt-6"}>
                      <Input id={`rv-kv-value-${index}`} className="font-mono" {...register(`key_values.${index}.value`)} />
                    </Field>
                    <Field id={`rv-kv-unit-${index}`} label={index === 0 ? "Unit" : undefined} className={index === 0 ? "" : "-mt-6"}>
                      <Input id={`rv-kv-unit-${index}`} {...register(`key_values.${index}.unit`)} />
                    </Field>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mb-0.5 text-danger hover:bg-danger-tint hover:text-danger"
                      onClick={() => keyValues.remove(index)}
                      aria-label={`Remove key value ${index + 1}`}
                    >
                      <LuTrash2 aria-hidden className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={() => keyValues.append({ label: "", value: "", unit: "" })}
            >
              <LuPlus aria-hidden className="size-3.5" />
              Add key value
            </Button>
          </div>

          <Field id="review-remarks" label="Remarks">
            <Textarea id="review-remarks" rows={3} {...register("remarks")} />
          </Field>

          {file ? (
            <p className="text-[13px] text-secondary">
              Attached file: <span className="font-medium text-ink">{file.name}</span>
            </p>
          ) : null}

          {rawText ? (
            <details className="rounded-input border border-line bg-app px-3 py-2.5">
              <summary className="cursor-default select-none text-[13px] font-medium text-secondary">Extracted text</summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-5 text-muted">{rawText}</pre>
            </details>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="secondary" size="sm" onClick={onBack} disabled={save.isPending}>
              Back
            </Button>
            <Button type="submit" size="sm" loading={save.isPending}>
              Save record
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
