import { getServerSession } from "next-auth";
import Link from "next/link";

import { SignOutButton } from "@/components/auth-buttons";
import { authOptions } from "@/lib/auth";

export async function SiteHeader() {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b border-black/10 bg-white/70 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
          Timur Forms
        </Link>

        <nav className="flex items-center gap-3">
          {session?.user && (
            <>
              <Link href="/forms" className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm font-medium hover:-translate-y-0.5">
                Forms
              </Link>
              <Link href="/my-submissions" className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm font-medium hover:-translate-y-0.5">
                My submissions
              </Link>
              {session.user.role === "ADMIN" && (
                <>
                  <Link href="/admin/forms" className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm font-medium hover:-translate-y-0.5">
                    Admin forms
                  </Link>
                  <Link href="/admin/submissions" className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm font-medium hover:-translate-y-0.5">
                    Admin submissions
                  </Link>
                </>
              )}
              <SignOutButton />
            </>
          )}

          {!session?.user && (
            <Link href="/signin" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
