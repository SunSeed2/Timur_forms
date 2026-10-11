import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@heroui/react";
import Link from "next/link";

export default async function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <section className="rounded-3xl border border-black/10 bg-white/70 p-8 shadow-2xl backdrop-blur-sm">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-600">
          Workflow driven forms
        </p>
        <h1 className="text-balance text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
          Build forms once, collect submissions clearly, reopen answers when
          needed.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-700">
          Admins create and publish forms. Users submit answers. Admins can
          reopen any submitted form so users can revise without losing what they
          already entered.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/signin"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Sign in to start
          </Link>
          <Link
            href="/forms"
            className="rounded-xl border border-black/15 bg-white px-5 py-3 text-sm font-semibold hover:-translate-y-0.5"
          >
            Open active forms
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border border-black/10 bg-white/75">
          <CardHeader>
            <CardTitle>Admin builder</CardTitle>
            <CardDescription>
              Create questions and answer options quickly.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            Supports text, single-choice, and multi-choice questions with
            publish control.
          </CardContent>
        </Card>

        <Card className="border border-black/10 bg-white/75">
          <CardHeader>
            <CardTitle>Submission tracking</CardTitle>
            <CardDescription>
              Every status transition is recorded.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            Draft, submitted, and reopened states stay visible to both users and
            admins.
          </CardContent>
        </Card>

        <Card className="border border-black/10 bg-white/75">
          <CardHeader>
            <CardTitle>Reopen without data loss</CardTitle>
            <CardDescription>
              Users can edit previously submitted answers.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            Reopen keeps previous answers prefilled so users update only what
            changed.
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
