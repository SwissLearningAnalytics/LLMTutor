import { createFileRoute } from "@tanstack/react-router";
import { AiModelForm } from "@/routes/admin/-components/ai-model-form";

export const Route = createFileRoute("/admin/models/create")({
  component: RouteComponent,
});

function RouteComponent() {
  return <AiModelForm mode="create" />;
}
