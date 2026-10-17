import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginView } from "@/components/auth/login-view";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <AuthCard>
      <Suspense>
        <LoginView />
      </Suspense>
    </AuthCard>
  );
}
