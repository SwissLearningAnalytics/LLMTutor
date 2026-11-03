import { mutationOptions } from "@tanstack/react-query";
import {
  createAiModel,
  deleteAiModel,
  updateAiModel,
} from "@/lib/api/ai-models/ai-models.functions";

export function createAiModelOptions() {
  return mutationOptions({
    mutationFn: createAiModel,
  });
}

export function updateAiModelOptions() {
  return mutationOptions({
    mutationFn: updateAiModel,
  });
}

export function deleteAiModelOptions() {
  return mutationOptions({
    mutationFn: deleteAiModel,
  });
}
