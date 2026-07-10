import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "@/lib/db";
import { type TutorInsert, tutors } from "@/lib/db/schema";

export const tutorInsertSchema = z.object({
  tutorId: z.string().min(1),
  displayName: z.string().min(1),
  prompt: z.string().min(1),
  learningObjectives: z.string().nullable().optional(),
});

export const tutorUpdateSchema = z
  .object({
    tutorId: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
    prompt: z.string().min(1).optional(),
    learningObjectives: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one tutor field must be provided",
  });

export const getTutors = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const tutors = await db.query.tutors.findMany();
    return tutors;
  } catch {
    throw new Error("Tutors could not be loaded");
  }
});

export const getTutor = createServerFn({ method: "GET" })
  .inputValidator(z.object({ tutorId: z.string() }))
  .handler(async ({ data: { tutorId } }) => {
    try {
      const tutor = await db.query.tutors.findFirst({
        where(fields, { eq }) {
          return eq(fields.tutorId, tutorId);
        },
      });
      return tutor;
    } catch {
      throw new Error(`Tutor ${tutorId} could not be loaded`);
    }
  });

export const createTutor = createServerFn({ method: "POST" })
  .inputValidator(tutorInsertSchema)
  .handler(async ({ data }) => {
    try {
      const [newTutor] = await db
        .insert(tutors)
        .values(data satisfies TutorInsert)
        .returning();
      return newTutor;
    } catch {
      throw new Error("Tutor could not be created");
    }
  });

export const updateTutor = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      tutorId: z.string().min(1),
      tutor: tutorUpdateSchema,
    }),
  )
  .handler(async ({ data: { tutorId, tutor } }) => {
    try {
      const [updatedTutor] = await db
        .update(tutors)
        .set(tutor)
        .where(eq(tutors.tutorId, tutorId))
        .returning();

      if (!updatedTutor) {
        throw new Error();
      }

      return updatedTutor;
    } catch {
      throw new Error(`Tutor ${tutorId} could not be updated`);
    }
  });

export const deleteTutor = createServerFn({ method: "POST" })
  .inputValidator(z.object({ tutorId: z.string().min(1) }))
  .handler(async ({ data: { tutorId } }) => {
    try {
      const [deletedTutor] = await db
        .delete(tutors)
        .where(eq(tutors.tutorId, tutorId))
        .returning();

      if (!deletedTutor) {
        throw new Error();
      }

      return deletedTutor;
    } catch {
      throw new Error(`Tutor ${tutorId} could not be deleted`);
    }
  });
