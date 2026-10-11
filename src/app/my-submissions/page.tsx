import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@heroui/react";

import { db } from "@/lib/db";
import { statusLabel } from "@/lib/format";
import { requireAuth } from "@/lib/guards";

export default async function MySubmissionsPage() {
  const session = await requireAuth();

  const submissions = await db.formSubmission.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      form: true,
      answers: {
        include: {
          question: true,
        },
      },
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-3xl font-bold">My submissions</h1>
      {submissions.map((submission) => (
        <Card key={submission.id} className="border border-black/10 bg-white/85">
          <CardHeader>
            <CardTitle>{submission.form.title}</CardTitle>
            <CardDescription>Status: {statusLabel(submission.status)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {submission.answers.map((answer) => (
              <div key={answer.id} className="rounded-xl bg-slate-50 p-3">
                <p className="font-semibold">{answer.question.prompt}</p>
                <p className="text-sm text-slate-700">{answer.valueText}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {submissions.length === 0 && (
        <Card className="border border-black/10 bg-white/85">
          <CardContent className="py-4 text-sm text-slate-700">No submissions yet.</CardContent>
        </Card>
      )}
    </main>
  );
}
