import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getAiModelOptions } from "@/lib/api/ai-models/query-options";
import { AiModelForm } from "@/routes/admin/-components/ai-model-form";

export const Route = createFileRoute("/admin/models/$modelId")({
  params: {
    parse: ({ modelId }) => ({ modelId: Number(modelId) }),
    stringify: ({ modelId }) => ({ modelId: String(modelId) }),
  },
  loader: ({ context: { queryClient }, params }) => {
    queryClient.ensureQueryData(getAiModelOptions(params.modelId));
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { modelId } = Route.useParams();
  const { data: model } = useSuspenseQuery(getAiModelOptions(modelId));

  return (
    <AiModelForm
      mode="edit"
      modelId={model.id}
      defaultValues={{
        name: model.name,
        label: model.label ?? "",
        isDefault: model.isDefault,
      }}
    />
  );
}
