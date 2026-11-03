import { queryOptions } from "@tanstack/react-query";
import {
  getAiModel,
  getAiModels,
} from "@/lib/api/ai-models/ai-models.functions";

export function getAiModelsOptions() {
  return queryOptions({
    queryKey: ["ai-models"],
    queryFn: getAiModels,
  });
}

export function getAiModelOptions(id: number) {
  return queryOptions({
    queryKey: ["ai-models", id],
    queryFn: () => getAiModel({ data: { id } }),
  });
}
