"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LuSave } from "react-icons/lu";
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
      toast("Profile saved.");
    },
    onError: (error) => {
      setServerError(error instanceof ApiError ? error.message : "Could not save the profile.");
    },
  });

  if (profile.isPending) {
    return <Card><CardBody><div className="h-96 animate-pulse rounded bg-line/70" /></CardBody></Card>;
  }
  if (profile.isError) {
    return <ErrorState message="Could not load the profile." onRetry={() => profile.refetch()} />;
  }

  return (
    <Card className="max-w-xl">
      <CardHeader title="Profile" description="Contact and clinical details shown to doctors during sharing." />
      <CardBody>
        {serverError ? <FormBanner message={serverError} /> : null}
        <form
          onSubmit={handleSubmit((values) => {
            setServerError(null);
            save.mutate(values);
          })}
          className="flex flex-col gap-4"
          noValidate
        >
          <Field id="profile-email" label="Email">
            <Input id="profile-email" value={profile.data.email} readOnly />
          </Field>
          <Field id="profile-full-name" label="Full name" required error={errors.full_name?.message}>
            <Input id="profile-full-name" invalid={!!errors.full_name} {...register("full_name")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="profile-dob" label="Date of birth" required error={errors.date_of_birth?.message}>
              <Input id="profile-dob" type="date" invalid={!!errors.date_of_birth} {...register("date_of_birth")} />
            </Field>
            <Field id="profile-phone" label="Phone" required error={errors.phone?.message}>
              <Input id="profile-phone" type="tel" inputMode="numeric" invalid={!!errors.phone} {...register("phone")} />
            </Field>
          </div>
          <Field id="profile-blood-group" label="Blood group" required error={errors.blood_group?.message}>
            <Select id="profile-blood-group" invalid={!!errors.blood_group} {...register("blood_group")}>
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="profile-allergies" label="Known allergies" error={errors.allergies?.message}>
            <Textarea id="profile-allergies" rows={2} invalid={!!errors.allergies} {...register("allergies")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="profile-ec-name" label="Emergency contact name" required error={errors.emergency_contact_name?.message}>
              <Input id="profile-ec-name" invalid={!!errors.emergency_contact_name} {...register("emergency_contact_name")} />
            </Field>
            <Field id="profile-ec-phone" label="Emergency contact phone" required error={errors.emergency_contact_phone?.message}>
              <Input id="profile-ec-phone" type="tel" inputMode="numeric" invalid={!!errors.emergency_contact_phone} {...register("emergency_contact_phone")} />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={isSubmitting || save.isPending}>
              <LuSave aria-hidden className="size-4" />
              Save changes
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
