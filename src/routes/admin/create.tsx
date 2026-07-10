import { createFileRoute } from "@tanstack/react-router";
import { TutorForm } from "@/routes/admin/-components/tutor-form";

export const Route = createFileRoute("/admin/create")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <TutorForm />
    </div>
  );
}
