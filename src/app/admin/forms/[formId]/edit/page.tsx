import { QuestionType } from "@prisma/client";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, TextArea } from "@heroui/react";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";

interface Props {
  params: Promise<{ formId: string }>;
}

const QUESTION_TYPE_OPTIONS: QuestionType[] = ["TEXT", "SINGLE_CHOICE", "MULTI_CHOICE"];

export default async function EditFormPage({ params }: Props) {
  await requireAdmin();
  const { formId } = await params;

  const form = await db.form.findUnique({
    where: { id: formId },
    include: {
      questions: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!form) {
    notFound();
  }

  const currentForm = form;

  async function toggleActiveAction() {
    "use server";

    await requireAdmin();

    await db.form.update({
      where: { id: formId },
      data: {
        isActive: !currentForm.isActive,
      },
    });

    revalidatePath(`/admin/forms/${formId}/edit`);
    revalidatePath("/forms");
    revalidatePath("/admin/forms");
  }

  async function addQuestionAction(formData: FormData) {
    "use server";

    await requireAdmin();

    const prompt = String(formData.get("prompt") ?? "").trim();
    const type = String(formData.get("type") ?? "TEXT") as QuestionType;
    const required = String(formData.get("required") ?? "true") === "true";
    const optionsRaw = String(formData.get("options") ?? "");

    if (!prompt || !QUESTION_TYPE_OPTIONS.includes(type)) {
      return;
    }

    const sortOrder = currentForm.questions.length + 1;

    const question = await db.question.create({
      data: {
        formId,
        prompt,
        type,
        required,
        sortOrder,
      },
    });

    if (type !== "TEXT") {
      const parsedOptions = optionsRaw
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((label, index) => ({
          questionId: question.id,
          label,
          value: label,
          sortOrder: index + 1,
        }));

      if (parsedOptions.length > 0) {
        await db.questionOption.createMany({ data: parsedOptions });
      }
    }

    revalidatePath(`/admin/forms/${formId}/edit`);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <Card className="sheet">
        <CardHeader>
          <CardTitle>{form.title}</CardTitle>
          <CardDescription>{form.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <p className="text-sm text-slate-700">Current status: {form.isActive ? "Active" : "Draft"}</p>
          <form action={toggleActiveAction}>
            <Button type="submit" variant={form.isActive ? "secondary" : "primary"}>
              {form.isActive ? "Unpublish" : "Publish"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-black/10 bg-white/80">
        <CardHeader>
          <CardTitle>Add question</CardTitle>
          <CardDescription>Create prompt and answer options for this form.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={addQuestionAction} className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
              Question
              <Input name="prompt" placeholder="What date did your trip start?" required />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Type
              <select name="type" className="rounded-xl border border-black/15 bg-white px-3 py-2">
                <option value="TEXT">Text</option>
                <option value="SINGLE_CHOICE">Single choice</option>
                <option value="MULTI_CHOICE">Multi choice</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Required
              <select name="required" className="rounded-xl border border-black/15 bg-white px-3 py-2">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
              Options (one per line for choice questions)
              <TextArea name="options" placeholder={"Approved\nDenied\nNeeds more info"} />
            </label>
            <div className="md:col-span-2">
              <Button type="submit" variant="primary">
                Add question
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        {form.questions.map((question) => (
          <Card key={question.id} className="border border-black/10 bg-white/80">
            <CardHeader>
              <CardTitle className="text-lg">
                {question.sortOrder}. {question.prompt}
              </CardTitle>
              <CardDescription>
                {question.type} {question.required ? "(required)" : "(optional)"}
              </CardDescription>
            </CardHeader>
            {question.options.length > 0 && (
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {question.options.map((option) => (
                    <li key={option.id}>{option.label}</li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>
        ))}
      </section>
    </main>
  );
}
