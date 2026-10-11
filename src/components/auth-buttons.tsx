"use client";

import { Button } from "@heroui/react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <Button variant="danger" onPress={() => signOut({ callbackUrl: "/" })}>
      Sign out
    </Button>
  );
}
