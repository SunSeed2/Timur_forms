import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@heroui/react";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";

export const instant = false;

function formatDateLocal(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function isValidRole(value: string): value is Role {
  return value === Role.USER || value === Role.ADMIN;
}

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          submissions: true,
          formsCreated: true,
        },
      },
    },
  });

  const adminCount = users.filter((user) => user.role === Role.ADMIN).length;

  async function createUserAction(formData: FormData) {
    "use server";

    await requireAdmin();

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");
    const roleRaw = String(formData.get("role") ?? Role.USER);

    if (
      !name ||
      !email ||
      !password ||
      password.length < 8 ||
      !email.includes("@") ||
      !isValidRole(roleRaw)
    ) {
      return;
    }

    const existing = await db.user.findUnique({ where: { email } });

    if (existing) {
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: roleRaw,
      },
    });

    revalidatePath("/admin/users");
  }

  async function changeRoleAction(formData: FormData) {
    "use server";

    await requireAdmin();

    const userId = String(formData.get("userId") ?? "");
    const roleRaw = String(formData.get("role") ?? "");

    if (!userId || !isValidRole(roleRaw)) {
      return;
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role === roleRaw) {
      return;
    }

    if (user.role === Role.ADMIN && roleRaw === Role.USER) {
      const currentAdminCount = await db.user.count({
        where: { role: Role.ADMIN },
      });

      if (currentAdminCount <= 1) {
        return;
      }
    }

    await db.user.update({
      where: { id: userId },
      data: { role: roleRaw },
    });

    revalidatePath("/admin/users");
  }

  async function resetPasswordAction(formData: FormData) {
    "use server";

    await requireAdmin();

    const userId = String(formData.get("userId") ?? "");
    const password = String(formData.get("password") ?? "");

    if (!userId || password.length < 8) {
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    revalidatePath("/admin/users");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <Card className="sheet">
        <CardHeader>
          <CardTitle>Admin users</CardTitle>
          <CardDescription>
            Create users, manage roles, and reset passwords.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 text-sm text-slate-700">
          <p>Total users: {users.length}</p>
          <p>Admins: {adminCount}</p>
          <p>Regular users: {users.length - adminCount}</p>
        </CardContent>
      </Card>

      <Card className="border border-black/10 bg-white/85">
        <CardHeader>
          <CardTitle>Create user</CardTitle>
          <CardDescription>
            Password must be at least 8 characters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createUserAction} className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Name
              <Input name="name" placeholder="Jane Doe" required />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Email
              <Input
                name="email"
                type="email"
                placeholder="jane@company.com"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Password
              <Input
                name="password"
                type="password"
                placeholder="Minimum 8 characters"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Role
              <select
                name="role"
                className="rounded-xl border border-black/15 bg-white px-3 py-2"
              >
                <option value={Role.USER}>USER</option>
                <option value={Role.ADMIN}>ADMIN</option>
              </select>
            </label>
            <div className="md:col-span-2">
              <Button type="submit" variant="primary">
                Create user
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        {users.map((user) => {
          const isLastAdmin = user.role === Role.ADMIN && adminCount <= 1;

          return (
            <Card key={user.id} className="border border-black/10 bg-white/85">
              <CardHeader>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>
                  {user.email} · {user.role} · Created{" "}
                  {formatDateLocal(user.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  <p>Submissions: {user._count.submissions}</p>
                  <p>Forms created: {user._count.formsCreated}</p>
                </div>

                <form
                  action={changeRoleAction}
                  className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700 space-y-2"
                >
                  <p className="font-semibold">Change role</p>
                  <input type="hidden" name="userId" value={user.id} />
                  <select
                    name="role"
                    defaultValue={user.role}
                    className="w-full rounded-xl border border-black/15 bg-white px-3 py-2"
                  >
                    <option value={Role.USER}>USER</option>
                    <option value={Role.ADMIN}>ADMIN</option>
                  </select>
                  <Button
                    type="submit"
                    variant="secondary"
                    isDisabled={isLastAdmin}
                  >
                    Save role
                  </Button>
                  {isLastAdmin && (
                    <p className="text-xs text-red-700">
                      Last admin cannot be demoted.
                    </p>
                  )}
                </form>

                <form
                  action={resetPasswordAction}
                  className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700 space-y-2"
                >
                  <p className="font-semibold">Reset password</p>
                  <input type="hidden" name="userId" value={user.id} />
                  <Input
                    name="password"
                    type="password"
                    placeholder="New password (min 8)"
                    required
                  />
                  <Button type="submit" variant="primary">
                    Set password
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
