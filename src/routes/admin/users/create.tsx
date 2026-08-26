import { createFileRoute } from "@tanstack/react-router";
import { UserForm } from "@/routes/admin/-components/user-form";
import { requireAdminRole } from "@/routes/admin/-utils/admin-auth";

export const Route = createFileRoute("/admin/users/create")({
  beforeLoad: requireAdminRole,
  component: RouteComponent,
});

function RouteComponent() {
  return <UserForm mode="create" />;
}
