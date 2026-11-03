import { providerName, seedAiModels } from "@/lib/ai/model";
import { db } from "@/lib/db";

export async function getDefaultModelName() {
  const defaultModel = await db.query.aiModels.findFirst({
    columns: { name: true },
    where(fields, { eq }) {
      return eq(fields.isDefault, true);
    },
  });

  // only happens if no default is maintained, e.g. before seeding
  return defaultModel?.name ?? seedAiModels[providerName][0];
}

export async function isAvailableModel(name: string) {
  const model = await db.query.aiModels.findFirst({
    columns: { id: true },
    where(fields, { eq }) {
      return eq(fields.name, name);
    },
  });

  return Boolean(model);
}

/**
 * Resolves the model a tutor uses: its own model or the default model if none is set.
 */
export async function resolveTutorModelName(tutorId: string) {
  const tutor = await db.query.tutors.findFirst({
    columns: { tutorId: true },
    with: { model: { columns: { name: true } } },
    where(fields, { eq }) {
      return eq(fields.tutorId, tutorId);
    },
  });

  return tutor?.model?.name ?? (await getDefaultModelName());
}
