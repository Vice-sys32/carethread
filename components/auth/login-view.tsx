"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { LuLogIn } from "react-icons/lu";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { loginSchema } from "@/lib/schemas";
import { safeNextPath } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormBanner } from "@/components/forms/form-banner";
import { roleHome } from "@/components/layout/root-redirect";
import { z } from "zod";

type LoginValues = z.infer<typeof loginSchema>;

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setServerError(null);
    try {
      const user = await api.auth.login(values);
      queryClient.setQueryData(["me"], user);
      toast("Signed in successfully.");
      router.replace(safeNextPath(params.get("next"), roleHome(user.role)));
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : "Could not sign in. Please verify your credentials.");
    }
  }

  return (
    <div>
      {serverError ? <FormBanner message={serverError} /> : null}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4.5" noValidate>
        <Field id="email" label="Email address" required error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            invalid={!!errors.email}
            {...register("email")}
          />
        </Field>
        <Field id="password" label="Password" required error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            invalid={!!errors.password}
            {...register("password")}
          />
        </Field>
        <Button type="submit" loading={isSubmitting} size="lg" className="mt-2 w-full gap-2">
          <LuLogIn aria-hidden className="size-4" />
          <span>Sign in to CareThread</span>
        </Button>
      </form>
    </div>
  );
}
