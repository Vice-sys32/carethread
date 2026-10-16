"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { doctorRegisterSchema, patientRegisterSchema } from "@/lib/schemas";
import { BLOOD_GROUPS, SPECIALTIES } from "@/lib/utils";
import type { RegisterPayload } from "@/types";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Segmented } from "@/components/ui/segmented";
import { FormBanner } from "@/components/forms/form-banner";
import { roleHome } from "@/components/layout/root-redirect";

type PatientValues = z.infer<typeof patientRegisterSchema>;
type DoctorValues = z.infer<typeof doctorRegisterSchema>;

const passwordHint = "At least 8 characters, with one letter and one number.";

function PatientRegisterForm({ onServerError }: { onServerError: (message: string) => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientValues>({
    resolver: zodResolver(patientRegisterSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      date_of_birth: "",
      phone: "",
      blood_group: "",
      allergies: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
    },
  });

  async function onSubmit(values: PatientValues) {
    onServerError("");
    const payload: RegisterPayload = { role: "patient", ...values };
    try {
      const user = await api.auth.register(payload);
      queryClient.setQueryData(["me"], user);
      toast("Account created.");
      router.replace(roleHome(user.role));
    } catch (error) {
      onServerError(error instanceof ApiError ? error.message : "Could not create the account. Try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Field id="full_name" label="Full name" required error={errors.full_name?.message}>
        <Input id="full_name" autoComplete="name" invalid={!!errors.full_name} {...register("full_name")} />
      </Field>
      <Field id="email" label="Email" required error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
      </Field>
      <Field id="password" label="Password" required error={errors.password?.message} hint={passwordHint}>
        <Input id="password" type="password" autoComplete="new-password" invalid={!!errors.password} {...register("password")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="date_of_birth" label="Date of birth" required error={errors.date_of_birth?.message}>
          <Input id="date_of_birth" type="date" invalid={!!errors.date_of_birth} {...register("date_of_birth")} />
        </Field>
        <Field id="phone" label="Phone" required error={errors.phone?.message}>
          <Input id="phone" type="tel" inputMode="numeric" autoComplete="tel" invalid={!!errors.phone} {...register("phone")} />
        </Field>
      </div>
      <Field id="blood_group" label="Blood group" required error={errors.blood_group?.message}>
        <Select id="blood_group" invalid={!!errors.blood_group} {...register("blood_group")}>
          <option value="">Select</option>
          {BLOOD_GROUPS.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="allergies" label="Known allergies" error={errors.allergies?.message}>
        <Textarea id="allergies" rows={2} invalid={!!errors.allergies} {...register("allergies")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="emergency_contact_name" label="Emergency contact name" required error={errors.emergency_contact_name?.message}>
          <Input id="emergency_contact_name" invalid={!!errors.emergency_contact_name} {...register("emergency_contact_name")} />
        </Field>
        <Field id="emergency_contact_phone" label="Emergency contact phone" required error={errors.emergency_contact_phone?.message}>
          <Input
            id="emergency_contact_phone"
            type="tel"
            inputMode="numeric"
            invalid={!!errors.emergency_contact_phone}
            {...register("emergency_contact_phone")}
          />
        </Field>
      </div>
      <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
        Create patient account
      </Button>
    </form>
  );
}

function DoctorRegisterForm({ onServerError }: { onServerError: (message: string) => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DoctorValues>({
    resolver: zodResolver(doctorRegisterSchema),
    defaultValues: { full_name: "", email: "", password: "", license_number: "", specialty: "", hospital_name: "" },
  });

  async function onSubmit(values: DoctorValues) {
    onServerError("");
    const payload: RegisterPayload = { role: "doctor", ...values };
    try {
      const user = await api.auth.register(payload);
      queryClient.setQueryData(["me"], user);
      toast("Account created.");
      router.replace(roleHome(user.role));
    } catch (error) {
      onServerError(error instanceof ApiError ? error.message : "Could not create the account. Try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Field id="full_name" label="Full name" required error={errors.full_name?.message}>
        <Input id="full_name" autoComplete="name" invalid={!!errors.full_name} {...register("full_name")} />
      </Field>
      <Field id="email" label="Email" required error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
      </Field>
      <Field id="password" label="Password" required error={errors.password?.message} hint={passwordHint}>
        <Input id="password" type="password" autoComplete="new-password" invalid={!!errors.password} {...register("password")} />
      </Field>
      <Field id="license_number" label="Medical license number" required error={errors.license_number?.message}>
        <Input id="license_number" className="font-mono" invalid={!!errors.license_number} {...register("license_number")} />
      </Field>
      <Field id="specialty" label="Specialty" required error={errors.specialty?.message}>
        <Select id="specialty" invalid={!!errors.specialty} {...register("specialty")}>
          <option value="">Select</option>
          {SPECIALTIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="hospital_name" label="Hospital or clinic name" required error={errors.hospital_name?.message}>
        <Input id="hospital_name" invalid={!!errors.hospital_name} {...register("hospital_name")} />
      </Field>
      <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
        Create doctor account
      </Button>
    </form>
  );
}

export function RegisterView() {
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [serverError, setServerError] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-1.5">
        <span className="text-xs font-medium text-secondary">Register as</span>
        <Segmented
          ariaLabel="Register as"
          value={role}
          onChange={(next) => {
            setRole(next);
            setServerError(null);
          }}
          options={[
            { value: "patient", label: "Patient" },
            { value: "doctor", label: "Doctor" },
          ]}
        />
      </div>
      {serverError ? <FormBanner message={serverError} /> : null}
      {role === "patient" ? (
        <PatientRegisterForm onServerError={(message) => setServerError(message || null)} />
      ) : (
        <DoctorRegisterForm onServerError={(message) => setServerError(message || null)} />
      )}
    </div>
  );
}
