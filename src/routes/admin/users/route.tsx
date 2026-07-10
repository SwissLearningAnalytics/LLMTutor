import { createFileRoute, redirect } from "@tanstack/react-router";
import type { User } from "better-auth";
import { getSession } from "@/lib/auth.functions";

export const Route = createFileRoute("/admin/users")({
  async beforeLoad() {
    const session = await getSession();

    if (!hasAdminRole(session?.user)) {
      throw redirect({ to: "/admin" });
    }
  },
});

function hasAdminRole(user: User | undefined) {
  if (!user) {
    return false;
  }
  const roles =
    "role" in user && typeof user.role === "string" ? user.role.split(",") : [];

  return roles.some((role) => role.trim() === "admin");
}
