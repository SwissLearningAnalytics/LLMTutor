import { providerName, seedAiModels } from "@/lib/ai/model";
import { db } from "@/lib/db";
import { aiModels } from "@/lib/db/schema";

export async function seedAiModelsIfEmpty() {
  try {
    const existingModel = await db.query.aiModels.findFirst({
      columns: { id: true },
    });
    if (existingModel) {
      return;
    }

    await db.insert(aiModels).values(
      seedAiModels[providerName].map((name, index) => ({
        name,
        isDefault: index === 0,
      })),
    );
    console.info(`Seeded the AI models for provider ${providerName}.`);
  } catch (error) {
    console.error(
      "Failed to seed the AI models. The server will continue without ensuring that AI models exist.",
      error,
    );
  }
}
