import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@heroui/react";
import Link from "next/link";

import { db } from "@/lib/db";
import { statusLabel } from "@/lib/format";
import { requireAuth } from "@/lib/guards";

export default async function FormsPage() {
  const session = await requireAuth();

  const forms = await db.form.findMany({
    where: { isActive: true },
    include: {
      questions: {
        select: { id: true },
      },
      submissions: {
        where: { userId: session.user.id },
        select: {
          id: true,
          status: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-3xl font-bold">Active forms</h1>
      <section className="grid gap-4 md:grid-cols-2">
        {forms.map((form) => {
          const mySubmission = form.submissions[0];

          return (
            <Card key={form.id} className="border border-black/10 bg-white/85">
              <CardHeader>
                <CardTitle>{form.title}</CardTitle>
                <CardDescription>{form.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-slate-700">
                <p>Questions: {form.questions.length}</p>
                <p>Status: {mySubmission ? statusLabel(mySubmission.status) : "Not started"}</p>
              </CardContent>
              <CardFooter>
                <Link
                  href={`/forms/${form.id}`}
                  className="rounded-xl border border-black/15 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  {mySubmission ? "Open submission" : "Start form"}
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
