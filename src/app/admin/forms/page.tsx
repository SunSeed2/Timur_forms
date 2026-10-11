import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, TextArea } from "@heroui/react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/guards";
import { db } from "@/lib/db";

export default async function AdminFormsPage() {
  await requireAdmin();

  const forms = await db.form.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          questions: true,
          submissions: true,
        },
      },
    },
  });

  async function createFormAction(formData: FormData) {
    "use server";

    const session = await requireAdmin();
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!title || !description) {
      return;
    }

    await db.form.create({
      data: {
        title,
        description,
        createdById: session.user.id,
      },
    });

    revalidatePath("/admin/forms");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <Card className="sheet">
        <CardHeader>
          <CardTitle>Create form</CardTitle>
          <CardDescription>Define a new form users can submit once published.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createFormAction} className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Form title
              <Input name="title" placeholder="Employee reimbursement" required />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
              Description
              <TextArea name="description" placeholder="What this form collects and who should fill it." required />
            </label>
            <div className="md:col-span-2">
              <Button type="submit" variant="primary">
                Create form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        {forms.map((form) => (
          <Card key={form.id} className="border border-black/10 bg-white/80">
            <CardHeader>
              <CardTitle>{form.title}</CardTitle>
              <CardDescription>{form.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>Status: {form.isActive ? "Active" : "Draft"}</p>
              <p>Questions: {form._count.questions}</p>
              <p>Submissions: {form._count.submissions}</p>
            </CardContent>
            <CardFooter>
              <Link
                href={`/admin/forms/${form.id}/edit`}
                className="rounded-xl border border-black/15 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Edit questions and options
              </Link>
            </CardFooter>
          </Card>
        ))}
      </section>
    </main>
  );
}
