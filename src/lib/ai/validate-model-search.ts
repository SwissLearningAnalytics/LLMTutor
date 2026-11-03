import { redirect } from "@tanstack/react-router";
import { checkAiModelAvailable } from "@/lib/api/ai-models/ai-models.functions";

/**
 * Drops the dev-only `?model=` override from the url if the model is not in the maintained model list.
 */
export async function validateModelSearch(
  model: string | undefined,
  pathname: string,
) {
  if (!model || (await checkAiModelAvailable({ data: { name: model } }))) {
    return;
  }

  if (typeof window !== "undefined") {
    alert(
      `Model ${model} is not supported. Supported models are maintained under /admin/models.`,
    );
  }
  throw redirect({ href: pathname });
}
