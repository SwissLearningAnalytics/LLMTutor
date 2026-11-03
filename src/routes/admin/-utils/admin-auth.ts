import { redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/auth.functions";
import { hasAdminRole } from "@/lib/auth-roles";

export async function requireAdminRole() {
  const session = await getSession();

  if (!hasAdminRole(session?.user)) {
    throw redirect({ to: "/admin" });
  }
}
