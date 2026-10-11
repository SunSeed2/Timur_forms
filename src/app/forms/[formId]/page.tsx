import { QuestionType, SubmissionStatus } from "@prisma/client";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, TextArea } from "@heroui/react";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { statusLabel } from "@/lib/format";
import { requireAuth } from "@/lib/guards";

interface Props {
  params: Promise<{ formId: string }>;
}

function parseMultiValue(valueText: string) {
  try {
    const parsed = JSON.parse(valueText);

    if (Array.isArray(parsed)) {
      return parsed.map((value) => String(value));
    }

    return [];
  } catch {
    return [];
  }
}

export default async function FormSubmissionPage({ params }: Props) {
  const session = await requireAuth();
  const { formId } = await params;

  const form = await db.form.findFirst({
    where: {
      id: formId,
      isActive: true,
    },
    include: {
      questions: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      submissions: {
        where: { userId: session.user.id },
        include: {
          answers: true,
        },
      },
    },
  });

  if (!form) {
    notFound();
  }

  const submission = form.submissions[0] ?? null;

  const answersByQuestion = new Map(submission?.answers.map((answer) => [answer.questionId, answer.valueText]));
  const canEdit = !submission || submission.status === SubmissionStatus.REOPENED || submission.status === SubmissionStatus.DRAFT;

  async function submitAction(formData: FormData) {
    "use server";

    const currentUser = await requireAuth();

    const currentForm = await db.form.findFirst({
      where: {
        id: formId,
        isActive: true,
      },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
          include: { options: true },
        },
      },
    });

    if (!currentForm) {
      return;
    }

    const existing = await db.formSubmission.findUnique({
      where: {
        formId_userId: {
          formId,
          userId: currentUser.user.id,
        },
      },
    });

    if (existing?.status === SubmissionStatus.SUBMITTED) {
      return;
    }

    const preparedAnswers = currentForm.questions.map((question) => {
      const key = `q_${question.id}`;

      if (question.type === QuestionType.MULTI_CHOICE) {
        const values = formData
          .getAll(key)
          .map((value) => String(value).trim())
          .filter(Boolean);

        if (question.required && values.length === 0) {
          throw new Error("Missing required answer");
        }

        return {
          questionId: question.id,
          valueText: JSON.stringify(values),
        };
      }

      const value = String(formData.get(key) ?? "").trim();

      if (question.required && !value) {
        throw new Error("Missing required answer");
      }

      return {
        questionId: question.id,
        valueText: value,
      };
    });

    await db.$transaction(async (tx) => {
      const savedSubmission = existing
        ? await tx.formSubmission.update({
            where: { id: existing.id },
            data: {
              status: SubmissionStatus.SUBMITTED,
              submittedAt: new Date(),
              reopenedAt: null,
            },
          })
        : await tx.formSubmission.create({
            data: {
              formId,
              userId: currentUser.user.id,
              status: SubmissionStatus.SUBMITTED,
              submittedAt: new Date(),
            },
          });

      await tx.submissionAnswer.deleteMany({
        where: { submissionId: savedSubmission.id },
      });

      await tx.submissionAnswer.createMany({
        data: preparedAnswers.map((answer) => ({
          submissionId: savedSubmission.id,
          questionId: answer.questionId,
          valueText: answer.valueText,
        })),
      });

      await tx.submissionHistory.create({
        data: {
          submissionId: savedSubmission.id,
          fromStatus: existing?.status ?? null,
          toStatus: SubmissionStatus.SUBMITTED,
          changedById: currentUser.user.id,
        },
      });
    });

    revalidatePath(`/forms/${formId}`);
    revalidatePath("/forms");
    revalidatePath("/my-submissions");
    revalidatePath("/admin/submissions");
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8">
      <Card className="sheet">
        <CardHeader>
          <CardTitle>{form.title}</CardTitle>
          <CardDescription>{form.description}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-700">
          Current status: {submission ? statusLabel(submission.status) : "Not started"}
        </CardContent>
      </Card>

      {!canEdit && (
        <Card className="border border-black/10 bg-white/85">
          <CardContent className="py-4 text-sm text-slate-700">
            Your response is submitted. An admin must reopen it before you can edit.
          </CardContent>
        </Card>
      )}

      <Card className="border border-black/10 bg-white/85">
        <CardHeader>
          <CardTitle>Answers</CardTitle>
          <CardDescription>Fill all required questions, then submit.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submitAction} className="space-y-6">
            {form.questions.map((question) => {
              const storedValue = answersByQuestion.get(question.id) ?? "";

              return (
                <div key={question.id} className="space-y-2 rounded-2xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    {question.sortOrder}. {question.prompt} {question.required ? "*" : ""}
                  </p>

                  {question.type === QuestionType.TEXT && (
                    <TextArea
                      name={`q_${question.id}`}
                      defaultValue={storedValue}
                      required={question.required}
                      disabled={!canEdit}
                      placeholder="Type your answer"
                    />
                  )}

                  {question.type === QuestionType.SINGLE_CHOICE && (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <label key={option.id} className="flex items-center gap-2 text-sm text-slate-800">
                          <input
                            type="radio"
                            name={`q_${question.id}`}
                            value={option.value}
                            defaultChecked={storedValue === option.value}
                            disabled={!canEdit}
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === QuestionType.MULTI_CHOICE && (
                    <div className="space-y-2">
                      {question.options.map((option) => {
                        const selectedValues = parseMultiValue(storedValue);

                        return (
                          <label key={option.id} className="flex items-center gap-2 text-sm text-slate-800">
                            <input
                              type="checkbox"
                              name={`q_${question.id}`}
                              value={option.value}
                              defaultChecked={selectedValues.includes(option.value)}
                              disabled={!canEdit}
                            />
                            {option.label}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {canEdit && (
              <Button type="submit" variant="primary" size="lg">
                Submit answers
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
