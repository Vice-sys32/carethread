"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { LuStethoscope, LuUserPlus } from "react-icons/lu";
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
      toast("Patient account created.");
      router.replace(roleHome(user.role));
    } catch (error) {
      onServerError(error instanceof ApiError ? error.message : "Could not create the account. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Field id="full_name" label="Full name" required error={errors.full_name?.message}>
        <Input id="full_name" autoComplete="name" placeholder="Dr. / Ms. / Mr. Full Name" invalid={!!errors.full_name} {...register("full_name")} />
      </Field>
      <Field id="email" label="Email address" required error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" placeholder="name@example.com" invalid={!!errors.email} {...register("email")} />
      </Field>
      <Field id="password" label="Password" required error={errors.password?.message} hint={passwordHint}>
        <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" invalid={!!errors.password} {...register("password")} />
      </Field>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field id="date_of_birth" label="Date of birth" required error={errors.date_of_birth?.message}>
          <Input id="date_of_birth" type="date" invalid={!!errors.date_of_birth} {...register("date_of_birth")} />
        </Field>
        <Field id="phone" label="Phone number" required error={errors.phone?.message}>
          <Input id="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="+91 98765 43210" invalid={!!errors.phone} {...register("phone")} />
        </Field>
      </div>
      <Field id="blood_group" label="Blood group" required error={errors.blood_group?.message}>
        <Select id="blood_group" invalid={!!errors.blood_group} {...register("blood_group")}>
          <option value="">Select blood group</option>
          {BLOOD_GROUPS.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="allergies" label="Known allergies" hint="E.g., Penicillin, Peanuts, Sulfa (or leave blank if none)" error={errors.allergies?.message}>
        <Textarea id="allergies" rows={2} placeholder="List any known drug or food allergies" invalid={!!errors.allergies} {...register("allergies")} />
      </Field>
      <div className="rounded-input border border-line bg-app/50 p-3 flex flex-col gap-3">
        <p className="text-xs font-semibold text-secondary">Emergency contact</p>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field id="emergency_contact_name" label="Contact name" required error={errors.emergency_contact_name?.message}>
            <Input id="emergency_contact_name" placeholder="Relative or guardian" invalid={!!errors.emergency_contact_name} {...register("emergency_contact_name")} />
          </Field>
          <Field id="emergency_contact_phone" label="Contact phone" required error={errors.emergency_contact_phone?.message}>
            <Input
              id="emergency_contact_phone"
              type="tel"
              inputMode="numeric"
              placeholder="+91 98765 43210"
              invalid={!!errors.emergency_contact_phone}
              {...register("emergency_contact_phone")}
            />
          </Field>
        </div>
      </div>
      <Button type="submit" loading={isSubmitting} size="lg" className="mt-2 w-full gap-2">
        <LuUserPlus aria-hidden className="size-4" />
        <span>Create patient account</span>
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
      toast("Doctor account created.");
      router.replace(roleHome(user.role));
    } catch (error) {
      onServerError(error instanceof ApiError ? error.message : "Could not create doctor account. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Field id="full_name" label="Full name" required error={errors.full_name?.message}>
        <Input id="full_name" autoComplete="name" placeholder="Dr. Full Name" invalid={!!errors.full_name} {...register("full_name")} />
      </Field>
      <Field id="email" label="Email address" required error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" placeholder="doctor@clinic.com" invalid={!!errors.email} {...register("email")} />
      </Field>
      <Field id="password" label="Password" required error={errors.password?.message} hint={passwordHint}>
        <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" invalid={!!errors.password} {...register("password")} />
      </Field>
      <Field id="license_number" label="Medical license number" required error={errors.license_number?.message}>
        <Input id="license_number" className="font-mono" placeholder="MCI-12345" invalid={!!errors.license_number} {...register("license_number")} />
      </Field>
      <Field id="specialty" label="Medical specialty" required error={errors.specialty?.message}>
        <Select id="specialty" invalid={!!errors.specialty} {...register("specialty")}>
          <option value="">Select specialty</option>
          {SPECIALTIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="hospital_name" label="Hospital or clinic name" required error={errors.hospital_name?.message}>
        <Input id="hospital_name" placeholder="City General Hospital" invalid={!!errors.hospital_name} {...register("hospital_name")} />
      </Field>
      <Button type="submit" loading={isSubmitting} size="lg" className="mt-2 w-full gap-2">
        <LuStethoscope aria-hidden className="size-4" />
        <span>Create doctor account</span>
      </Button>
    </form>
  );
}

export function RegisterView() {
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [serverError, setServerError] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-2">
        <span className="text-xs font-semibold text-secondary">Account type</span>
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
