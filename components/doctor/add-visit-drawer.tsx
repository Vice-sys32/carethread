"use client";

import { useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { z } from "zod";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/provider";
import { visitSchema } from "@/lib/schemas";
import { formatBytes, toInputDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { VisitPayload } from "@/types";

type VisitValues = z.infer<typeof visitSchema>;

interface AddVisitDrawerProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  consentToken: string;
}

export function AddVisitDrawer({ open, onClose, patientId, consentToken }: AddVisitDrawerProps) {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VisitValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      visit_date: toInputDate(new Date()),
      hospital_name: user?.hospital_name ?? "",
      diagnosis: "",
      medications: [],
      remarks: "",
      follow_up_date: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "medications" });

  const save = useMutation({
    mutationFn: (payload: VisitPayload | FormData) => api.doctor.addVisit(patientId, consentToken, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["doctor-patient", patientId, "records"] });
      await queryClient.invalidateQueries({ queryKey: ["doctor-recent"] });
      toast("Visit saved.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      reset();
      onClose();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Could not save the visit.", "danger");
    },
  });

  async function onSubmit(values: VisitValues) {
    const medications = values.medications.map((medication) => ({
      name: medication.name,
      dose: medication.dose,
      frequency: medication.frequency,
      duration: medication.duration || undefined,
      status: medication.status,
    }));
    if (file) {
      const formData = new FormData();
      formData.set("visit_date", values.visit_date);
      formData.set("hospital_name", values.hospital_name);
      formData.set("diagnosis", values.diagnosis);
      formData.set("remarks", values.remarks);
      if (values.follow_up_date) formData.set("follow_up_date", values.follow_up_date);
      formData.set("medications", JSON.stringify(medications));
      formData.set("file", file);
      await save.mutateAsync(formData);
      return;
    }
    await save.mutateAsync({
      visit_date: values.visit_date,
      hospital_name: values.hospital_name,
      diagnosis: values.diagnosis,
      remarks: values.remarks,
      follow_up_date: values.follow_up_date || undefined,
      medications,
    });
  }

  return (
    <Drawer
      open={open}
      onClose={() => {
        onClose();
      }}
      title="Add visit"
      description="The visit is added to the patient timeline for future doctors."
      width="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button size="sm" loading={save.isPending} onClick={handleSubmit(onSubmit)}>
            Save visit
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="visit_date" label="Visit date" required error={errors.visit_date?.message}>
            <Input id="visit_date" type="date" invalid={!!errors.visit_date} {...register("visit_date")} />
          </Field>
          <Field id="hospital_name" label="Hospital or clinic" required error={errors.hospital_name?.message}>
            <Input id="hospital_name" invalid={!!errors.hospital_name} {...register("hospital_name")} />
          </Field>
        </div>

        <Field id="diagnosis" label="Diagnosis" required error={errors.diagnosis?.message}>
          <Input id="diagnosis" invalid={!!errors.diagnosis} {...register("diagnosis")} />
        </Field>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-secondary">
              Medications <span className="font-normal text-muted">(optional)</span>
            </span>
            {fields.length === 0 ? (
              <p className="text-[13px] text-muted">No medications added for this visit.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {fields.map((field, index) => (
                  <li key={field.id} className="rounded-input border border-line p-2.5">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Field id={`med-name-${index}`} label="Name" required error={errors.medications?.[index]?.name?.message} className="sm:col-span-2">
                        <Input
                          id={`med-name-${index}`}
                          invalid={!!errors.medications?.[index]?.name}
                          {...register(`medications.${index}.name` as const)}
                        />
                      </Field>
                      <Field id={`med-dose-${index}`} label="Dose" required error={errors.medications?.[index]?.dose?.message}>
                        <Input
                          id={`med-dose-${index}`}
                          placeholder="500 mg"
                          invalid={!!errors.medications?.[index]?.dose}
                          {...register(`medications.${index}.dose` as const)}
                        />
                      </Field>
                      <Field id={`med-frequency-${index}`} label="Frequency" required error={errors.medications?.[index]?.frequency?.message}>
                        <Input
                          id={`med-frequency-${index}`}
                          placeholder="Twice daily"
                          invalid={!!errors.medications?.[index]?.frequency}
                          {...register(`medications.${index}.frequency` as const)}
                        />
                      </Field>
                      <Field id={`med-duration-${index}`} label="Duration" error={errors.medications?.[index]?.duration?.message}>
                        <Input id={`med-duration-${index}`} placeholder="10 days" {...register(`medications.${index}.duration` as const)} />
                      </Field>
                      <Field id={`med-status-${index}`} label="Status" required>
                        <Select id={`med-status-${index}`} {...register(`medications.${index}.status` as const)}>
                          <option value="current">Current</option>
                          <option value="past">Past</option>
                        </Select>
                      </Field>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 text-danger hover:bg-danger-tint hover:text-danger"
                      onClick={() => remove(index)}
                      aria-label={`Remove medication ${index + 1}`}
                    >
                      <LuTrash2 aria-hidden className="size-3.5" />
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="secondary" size="sm" className="self-start" onClick={() => append({ name: "", dose: "", frequency: "", duration: "", status: "current" })}>
              <LuPlus aria-hidden className="size-3.5" />
              Add medication
            </Button>
          </div>

          <Controller
            control={control}
            name="remarks"
            render={({ field, fieldState }) => (
              <Field
                id="remarks"
                label="Remarks and notes for future doctors"
                error={fieldState.error?.message}
                className="gap-1"
              >
                <Textarea
                  id="remarks"
                  rows={5}
                  showCount
                  maxLength={2000}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  invalid={!!fieldState.error}
                />
              </Field>
            )}
          />

          <Field id="follow_up_date" label="Follow-up date">
            <Input id="follow_up_date" type="date" {...register("follow_up_date")} />
          </Field>

          <Field id="visit_file" label="Attach file">
            <input
              id="visit_file"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="block w-full text-[13px] text-secondary file:mr-3 file:h-8 file:rounded-input file:border file:border-line-strong file:bg-surface file:px-2.5 file:text-[13px] file:font-medium file:text-ink hover:file:bg-app"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </Field>
          {file ? <p className="text-xs text-muted">{file.name} · {formatBytes(file.size)}</p> : null}
      </form>
    </Drawer>
  );
}
