import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterView } from "@/components/auth/register-view";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <AuthCard>
      <RegisterView />
    </AuthCard>
  );
}
