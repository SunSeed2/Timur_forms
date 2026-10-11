import { SubmissionStatus } from "@prisma/client";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@heroui/react";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { statusLabel } from "@/lib/format";
import { requireAdmin } from "@/lib/guards";

export default async function AdminSubmissionsPage() {
  await requireAdmin();

  const submissions = await db.formSubmission.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      form: true,
      user: true,
      answers: {
        include: {
          question: true,
        },
      },
    },
  });

  async function reopenAction(formData: FormData) {
    "use server";

    const admin = await requireAdmin();
    const submissionId = String(formData.get("submissionId") ?? "");
    const reason = String(formData.get("reason") ?? "").trim();

    if (!submissionId) {
      return;
    }

    const existing = await db.formSubmission.findUnique({ where: { id: submissionId } });

    if (!existing || existing.status !== SubmissionStatus.SUBMITTED) {
      return;
    }

    await db.$transaction(async (tx) => {
      await tx.formSubmission.update({
        where: { id: submissionId },
        data: {
          status: SubmissionStatus.REOPENED,
          reopenedAt: new Date(),
        },
      });

      await tx.submissionHistory.create({
        data: {
          submissionId,
          fromStatus: existing.status,
          toStatus: SubmissionStatus.REOPENED,
          changedById: admin.user.id,
          reason: reason || null,
        },
      });
    });

    revalidatePath("/admin/submissions");
    revalidatePath("/forms");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-3xl font-bold">Admin submissions</h1>
      {submissions.map((submission) => (
        <Card key={submission.id} className="border border-black/10 bg-white/85">
          <CardHeader>
            <CardTitle>{submission.form.title}</CardTitle>
            <CardDescription>
              {submission.user.email} · {statusLabel(submission.status)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm text-slate-800">
              {submission.answers.map((answer) => (
                <div key={answer.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="font-semibold">{answer.question.prompt}</p>
                  <p className="text-slate-700">{answer.valueText}</p>
                </div>
              ))}
            </div>

            {submission.status === SubmissionStatus.SUBMITTED && (
              <form action={reopenAction} className="grid gap-2 md:grid-cols-[1fr_auto]">
                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  Reopen reason (optional)
                  <Input name="reason" placeholder="Need revised details" />
                </label>
                <input type="hidden" name="submissionId" value={submission.id} />
                <Button type="submit" variant="secondary" className="md:self-end">
                  Reopen for user edits
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
