"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LuHeartPulse, LuPhone, LuSave, LuShield, LuUser } from "react-icons/lu";
import { z } from "zod";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { patientProfileSchema } from "@/lib/schemas";
import { BLOOD_GROUPS } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormBanner } from "@/components/forms/form-banner";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

type ProfileValues = z.infer<typeof patientProfileSchema>;

function PatientProfileForm() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["patient-profile"], queryFn: () => api.patient.getProfile() });
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(patientProfileSchema),
    defaultValues: {
      full_name: "",
      date_of_birth: "",
      phone: "",
      blood_group: "",
      allergies: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
    },
  });

  useEffect(() => {
    if (profile.data) {
      reset({
        full_name: profile.data.full_name,
        date_of_birth: profile.data.date_of_birth,
        phone: profile.data.phone,
        blood_group: profile.data.blood_group,
        allergies: profile.data.allergies,
        emergency_contact_name: profile.data.emergency_contact_name,
        emergency_contact_phone: profile.data.emergency_contact_phone,
      });
    }
  }, [profile.data, reset]);

  const save = useMutation({
    mutationFn: (values: ProfileValues) => api.patient.updateProfile(values),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["patient-profile"], updated);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast("Profile updated successfully.");
    },
    onError: (error) => {
      setServerError(error instanceof ApiError ? error.message : "Could not save profile changes.");
    },
  });

  if (profile.isPending) {
    return (
      <Card className="max-w-2xl mx-auto shadow-card">
        <CardBody className="p-6">
          <Skeleton className="h-96 w-full rounded-card" />
        </CardBody>
      </Card>
    );
  }
  if (profile.isError) {
    return <ErrorState message="Could not load your profile details." onRetry={() => profile.refetch()} />;
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-card">
      <CardHeader
        title="Patient Profile & Clinical Settings"
        description="Your verified identity and health attributes shown to authorized physicians during consultations."
      />
      <CardBody className="p-6 sm:p-7">
        {serverError ? <FormBanner message={serverError} /> : null}

        <form
          onSubmit={handleSubmit((values) => {
            setServerError(null);
            save.mutate(values);
          })}
          className="flex flex-col gap-6"
          noValidate
        >
          {/* Section 1: Identity & Contact */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-1 border-b border-line">
              <LuUser className="size-4 text-leaf" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest-dark">
                Personal Information
              </h2>
            </div>

            <Field id="profile-email" label="Account Email" hint="Your email is verified and cannot be altered directly.">
              <Input id="profile-email" value={profile.data.email} readOnly className="bg-app font-mono text-xs" />
            </Field>

            <Field id="profile-full-name" label="Full Legal Name" required error={errors.full_name?.message}>
              <Input id="profile-full-name" invalid={!!errors.full_name} {...register("full_name")} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="profile-dob" label="Date of Birth" required error={errors.date_of_birth?.message}>
                <Input id="profile-dob" type="date" invalid={!!errors.date_of_birth} {...register("date_of_birth")} />
              </Field>
              <Field id="profile-phone" label="Contact Phone" required error={errors.phone?.message}>
                <Input id="profile-phone" type="tel" inputMode="numeric" invalid={!!errors.phone} {...register("phone")} />
              </Field>
            </div>
          </div>

          {/* Section 2: Clinical Data */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-1 border-b border-line">
              <LuHeartPulse className="size-4 text-leaf" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest-dark">
                Clinical Vitals & Allergies
              </h2>
            </div>

            <Field id="profile-blood-group" label="Blood Group" required error={errors.blood_group?.message}>
              <Select id="profile-blood-group" invalid={!!errors.blood_group} {...register("blood_group")}>
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </Select>
            </Field>

            <Field id="profile-allergies" label="Known Allergies" hint="Crucial for doctor prescription safety." error={errors.allergies?.message}>
              <Textarea id="profile-allergies" rows={2} placeholder="List any medicine or food allergies, or leave blank if none" invalid={!!errors.allergies} {...register("allergies")} />
            </Field>
          </div>

          {/* Section 3: Emergency Contact */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-1 border-b border-line">
              <LuPhone className="size-4 text-leaf" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest-dark">
                Emergency Contact
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="profile-ec-name" label="Emergency Contact Person" required error={errors.emergency_contact_name?.message}>
                <Input id="profile-ec-name" invalid={!!errors.emergency_contact_name} {...register("emergency_contact_name")} />
              </Field>
              <Field id="profile-ec-phone" label="Emergency Phone" required error={errors.emergency_contact_phone?.message}>
                <Input id="profile-ec-phone" type="tel" inputMode="numeric" invalid={!!errors.emergency_contact_phone} {...register("emergency_contact_phone")} />
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-line pt-5">
            <p className="text-xs text-muted flex items-center gap-1.5">
              <LuShield className="size-3.5 text-leaf" />
              <span>Data saved to your private record</span>
            </p>
            <Button type="submit" size="md" loading={isSubmitting || save.isPending} className="gap-2">
              <LuSave aria-hidden className="size-4" />
              <span>Save Profile</span>
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

export function ProfileView() {
  return <PatientProfileForm />;
}
