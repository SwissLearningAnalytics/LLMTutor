import { createFileRoute } from "@tanstack/react-router";
import { getAiModelsOptions } from "@/lib/api/ai-models/query-options";
import { TutorForm } from "@/routes/admin/-components/tutor-form";

export const Route = createFileRoute("/admin/create")({
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(getAiModelsOptions());
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <TutorForm />
    </div>
  );
}
