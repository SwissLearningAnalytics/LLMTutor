import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRole } from "@/routes/admin/-utils/admin-auth";

export const Route = createFileRoute("/admin/models")({
  beforeLoad: requireAdminRole,
});
