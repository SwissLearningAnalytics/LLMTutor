import { createServerFn } from "@tanstack/react-start";
import { asc, count, eq, getTableColumns, ne } from "drizzle-orm";
import z from "zod";
import { isAvailableModel } from "@/lib/ai/resolve-model";
import { ensureAdminSession, ensureSession } from "@/lib/auth.functions";
import { db } from "@/lib/db";
import { aiModels, tutors } from "@/lib/db/schema";

export const aiModelSchema = z.object({
  name: z.string().trim().min(1).max(64),
  label: z.string().trim().nullable().optional(),
  isDefault: z.boolean(),
});

export const getAiModels = createServerFn({ method: "GET" }).handler(
  async () => {
    await ensureSession();

    try {
      return await db
        .select({
          ...getTableColumns(aiModels),
          tutorCount: count(tutors.id),
        })
        .from(aiModels)
        .leftJoin(tutors, eq(tutors.modelId, aiModels.id))
        .groupBy(aiModels.id)
        .orderBy(asc(aiModels.name));
    } catch {
      throw new Error("AI models could not be loaded");
    }
  },
);

export const getAiModel = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.number().int() }))
  .handler(async ({ data: { id } }) => {
    await ensureAdminSession();

    const model = await db.query.aiModels.findFirst({
      where(fields, { eq }) {
        return eq(fields.id, id);
      },
    });
    if (!model) {
      throw new Error(`AI model ${id} could not be loaded`);
    }
    return model;
  });

// only used to validate the dev-only model override in the url, hence no session required
export const checkAiModelAvailable = createServerFn({ method: "GET" })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data: { name } }) => {
    return await isAvailableModel(name);
  });

export const createAiModel = createServerFn({ method: "POST" })
  .validator(aiModelSchema)
  .handler(async ({ data }) => {
    await ensureAdminSession();

    try {
      return await db.transaction(async (tx) => {
        if (data.isDefault) {
          await tx.update(aiModels).set({ isDefault: false });
        }
        const [newModel] = await tx
          .insert(aiModels)
          .values({ ...data, label: data.label || null })
          .returning();
        return newModel;
      });
    } catch {
      throw new Error(
        `Das Modell ${data.name} konnte nicht erstellt werden. Existiert es bereits?`,
      );
    }
  });

export const updateAiModel = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int(), model: aiModelSchema.partial() }))
  .handler(async ({ data: { id, model } }) => {
    await ensureAdminSession();

    const existingModel = await db.query.aiModels.findFirst({
      columns: { isDefault: true },
      where(fields, { eq }) {
        return eq(fields.id, id);
      },
    });
    if (!existingModel) {
      throw new Error(`AI model ${id} could not be found`);
    }
    // the default can only be changed by making another model the default
    if (existingModel.isDefault && model.isDefault === false) {
      throw new Error("Lege zuerst ein anderes Modell als Standard fest.");
    }

    try {
      return await db.transaction(async (tx) => {
        if (model.isDefault) {
          await tx
            .update(aiModels)
            .set({ isDefault: false })
            .where(ne(aiModels.id, id));
        }
        const [updatedModel] = await tx
          .update(aiModels)
          .set({
            ...model,
            ...(model.label !== undefined && { label: model.label || null }),
          })
          .where(eq(aiModels.id, id))
          .returning();
        return updatedModel;
      });
    } catch {
      throw new Error(
        "Das Modell konnte nicht aktualisiert werden. Existiert der Name bereits?",
      );
    }
  });

export const deleteAiModel = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int() }))
  .handler(async ({ data: { id } }) => {
    await ensureAdminSession();

    const model = await db.query.aiModels.findFirst({
      columns: { isDefault: true },
      with: { tutors: { columns: { id: true }, limit: 1 } },
      where(fields, { eq }) {
        return eq(fields.id, id);
      },
    });
    if (!model) {
      throw new Error(`AI model ${id} could not be found`);
    }
    if (model.isDefault) {
      throw new Error("Das Standardmodell kann nicht gelöscht werden.");
    }
    if (model.tutors.length > 0) {
      throw new Error(
        "Das Modell wird von Tutoren verwendet und kann nicht gelöscht werden.",
      );
    }

    try {
      const [deletedModel] = await db
        .delete(aiModels)
        .where(eq(aiModels.id, id))
        .returning();
      return deletedModel;
    } catch {
      throw new Error(`AI model ${id} could not be deleted`);
    }
  });
