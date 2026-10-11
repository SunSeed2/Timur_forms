"use client";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@heroui/react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials.");
      setLoading(false);
      return;
    }

    window.location.href = result?.url ?? callbackUrl;
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md border border-black/10 bg-white/80 shadow-xl backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Email
              <Input
                name="email"
                type="email"
                placeholder="admin@timurforms.local"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Password
              <Input
                name="password"
                type="password"
                placeholder="Your password"
                required
              />
            </label>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isDisabled={loading}
            >
              {loading ? "Signing in..." : "Enter workspace"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-slate-600">
            Seed user password is <strong>ChangeMe123!</strong>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
