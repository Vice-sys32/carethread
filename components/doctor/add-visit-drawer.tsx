"use client";

import { useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LuFileText, LuPlus, LuSave, LuStethoscope, LuTrash2 } from "react-icons/lu";
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
      toast("Clinical visit saved to patient record.");
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
      title={
        <div className="flex items-center gap-2">
          <LuStethoscope className="size-5 text-leaf" />
          <span>Add Consultation Visit</span>
        </div>
      }
      description="Record diagnosis, prescriptions, and notes. This is added permanently to the patient's CareThread."
      width="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button size="sm" loading={save.isPending} onClick={handleSubmit(onSubmit)} className="gap-1.5">
            <LuSave className="size-3.5" />
            <span>Save Visit Entry</span>
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4.5" noValidate>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field id="visit_date" label="Visit Date" required error={errors.visit_date?.message}>
            <Input id="visit_date" type="date" invalid={!!errors.visit_date} {...register("visit_date")} />
          </Field>
          <Field id="hospital_name" label="Hospital or Clinic" required error={errors.hospital_name?.message}>
            <Input id="hospital_name" placeholder="City General Clinic" invalid={!!errors.hospital_name} {...register("hospital_name")} />
          </Field>
        </div>

        <Field id="diagnosis" label="Clinical Diagnosis" required error={errors.diagnosis?.message}>
          <Input id="diagnosis" placeholder="Primary clinical diagnosis / condition" invalid={!!errors.diagnosis} {...register("diagnosis")} />
        </Field>

        {/* Dynamic Medications List */}
        <div className="rounded-card border border-line bg-app/30 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-forest-dark">
              Prescribed Medications <span className="font-normal text-muted">(Optional)</span>
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={() => append({ name: "", dose: "", frequency: "", duration: "", status: "current" })}
            >
              <LuPlus aria-hidden className="size-3.5" />
              <span>Add medication</span>
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="text-xs text-muted">No new medications prescribed in this consultation.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {fields.map((field, index) => (
                <li key={field.id} className="rounded-input border border-line bg-surface p-3 flex flex-col gap-2.5">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field id={`med-name-${index}`} label="Medicine Name" required error={errors.medications?.[index]?.name?.message} className="sm:col-span-2">
                      <Input
                        id={`med-name-${index}`}
                        placeholder="Amoxicillin"
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
                      <Input id={`med-duration-${index}`} placeholder="7 days" {...register(`medications.${index}.duration` as const)} />
                    </Field>
                    <Field id={`med-status-${index}`} label="Status" required>
                      <Select id={`med-status-${index}`} {...register(`medications.${index}.status` as const)}>
                        <option value="current">Current / Active</option>
                        <option value="past">Completed / Past</option>
                      </Select>
                    </Field>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="self-end text-danger hover:bg-danger-tint hover:text-danger h-7 px-2"
                    onClick={() => remove(index)}
                    aria-label={`Remove medication ${index + 1}`}
                  >
                    <LuTrash2 aria-hidden className="size-3.5" />
                    <span>Remove medication</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Controller
          control={control}
          name="remarks"
          render={({ field, fieldState }) => (
            <Field
              id="remarks"
              label="Consultation Notes & Remarks for Future Doctors"
              error={fieldState.error?.message}
            >
              <Textarea
                id="remarks"
                rows={4}
                showCount
                maxLength={2000}
                placeholder="Physical examination notes, lab requests, dietary guidelines..."
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                invalid={!!fieldState.error}
              />
            </Field>
          )}
        />

        <Field id="follow_up_date" label="Recommended Follow-up Date">
          <Input id="follow_up_date" type="date" {...register("follow_up_date")} />
        </Field>

        <Field id="visit_file" label="Attach Clinical Report / Prescription File">
          <div className="flex flex-col gap-2">
            <input
              id="visit_file"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="block w-full text-xs text-secondary file:mr-3 file:h-8.5 file:rounded-input file:border file:border-line-strong file:bg-surface file:px-3 file:text-xs file:font-semibold file:text-forest-dark hover:file:bg-mint/40 file:cursor-pointer"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center gap-2 text-xs text-forest font-medium">
                <LuFileText className="size-3.5" />
                <span>{file.name} ({formatBytes(file.size)})</span>
              </div>
            ) : null}
          </div>
        </Field>
      </form>
    </Drawer>
  );
}
