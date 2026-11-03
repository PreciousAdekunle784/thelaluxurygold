import type { Metadata } from "next";
import { Suspense } from "react";
import { Monogram } from "@/components/brand/Logo";
import { LoginForm } from "@/components/admin/LoginForm";
import { adminConfigured } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLogin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-forest px-5 py-16">
      <div className="w-full max-w-sm bg-ivory p-8 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)] md:p-10">
        <Monogram className="mx-auto h-14 w-auto" />
        <h1 className="mt-6 text-center font-display text-3xl">Admin</h1>
        <p className="mt-2 text-center text-sm text-stone">LA Luxury Gold store management</p>
        {!adminConfigured() && (
          <p className="mt-6 border-l-2 border-burgundy bg-white p-3 text-xs leading-relaxed text-burgundy">
            Admin access is disabled until an <code>ADMIN_PASSWORD</code> environment variable is set.
          </p>
        )}
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
