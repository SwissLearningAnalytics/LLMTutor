import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { getAiModelsOptions } from "@/lib/api/ai-models/query-options";
import { getOwnTutorOptions } from "@/lib/api/tutors/query-options";
import { TutorForm } from "@/routes/admin/-components/tutor-form";

export const Route = createFileRoute("/admin/$tutorId/edit")({
  loader: ({ context: { queryClient }, params }) => {
    queryClient.ensureQueryData(getOwnTutorOptions(params.tutorId));
    queryClient.ensureQueryData(getAiModelsOptions());
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { tutorId } = Route.useParams();
  const { data: tutor } = useSuspenseQuery(getOwnTutorOptions(tutorId));

  if (!tutor) {
    throw notFound();
  }

  return (
    <TutorForm
      mode="edit"
      tutorId={tutor.tutorId}
      defaultValues={{
        tutorId: tutor.tutorId,
        displayName: tutor.displayName,
        prompt: tutor.prompt,
        learningObjectives: tutor.learningObjectives ?? undefined,
        published: tutor.published,
        modelId: tutor.modelId,
      }}
    />
  );
}
