import { redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/auth.functions";

type UserWithRole = {
  role?: string | string[] | null;
};

export async function requireAdminRole() {
  const session = await getSession();

  if (!hasAdminRole(session?.user)) {
    throw redirect({ to: "/admin" });
  }
}

function hasAdminRole(user: UserWithRole | null | undefined) {
  const roles = Array.isArray(user?.role)
    ? user.role
    : (user?.role ?? "").split(",");

  return roles.some((role) => role.trim() === "admin");
}
