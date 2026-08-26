import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import z from "zod";
import { ensureSession } from "@/lib/auth.functions";
import { db } from "@/lib/db";
import { type TutorInsert, tutors } from "@/lib/db/schema";

export const tutorInsertSchema = z.object({
  tutorId: z.string().min(1),
  displayName: z.string().min(1),
  prompt: z.string().min(1),
  learningObjectives: z.string().nullable().optional(),
  published: z.boolean().optional(),
});

export const tutorUpdateSchema = z
  .object({
    tutorId: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
    prompt: z.string().min(1).optional(),
    learningObjectives: z.string().nullable().optional(),
    published: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one tutor field must be provided",
  });

export const getTutors = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const tutors = await db.query.tutors.findMany({
      columns: {
        tutorId: true,
        displayName: true,
      },
      where(fields, { eq }) {
        return eq(fields.published, true);
      },
      orderBy(fields, { asc }) {
        return asc(fields.displayName);
      },
    });
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
        columns: {
          tutorId: true,
          displayName: true,
          prompt: true,
          learningObjectives: true,
        },
        where(fields, { and, eq }) {
          return and(eq(fields.tutorId, tutorId), eq(fields.published, true));
        },
      });
      if (!tutor) {
        throw new Error();
      }
      return tutor;
    } catch {
      throw new Error(`Tutor ${tutorId} could not be loaded`);
    }
  });

export const getOwnTutors = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await ensureSession();

    try {
      return await db.query.tutors.findMany({
        columns: {
          tutorId: true,
          displayName: true,
          published: true,
        },
        where(fields, { eq }) {
          return eq(fields.userId, session.user.id);
        },
        orderBy(fields, { asc }) {
          return asc(fields.displayName);
        },
      });
    } catch {
      throw new Error("Tutors could not be loaded");
    }
  },
);

export const getOwnTutor = createServerFn({ method: "GET" })
  .inputValidator(z.object({ tutorId: z.string() }))
  .handler(async ({ data: { tutorId } }) => {
    const session = await ensureSession();

    try {
      const tutor = await db.query.tutors.findFirst({
        where(fields, { and, eq }) {
          return and(
            eq(fields.tutorId, tutorId),
            eq(fields.userId, session.user.id),
          );
        },
      });
      if (!tutor) {
        throw new Error();
      }
      return tutor;
    } catch {
      throw new Error(`Tutor ${tutorId} could not be loaded`);
    }
  });

export const createTutor = createServerFn({ method: "POST" })
  .inputValidator(tutorInsertSchema)
  .handler(async ({ data }) => {
    const session = await ensureSession();

    try {
      const [newTutor] = await db
        .insert(tutors)
        .values({ ...data, userId: session.user.id } satisfies TutorInsert)
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
    const session = await ensureSession();

    try {
      const [updatedTutor] = await db
        .update(tutors)
        .set(tutor)
        .where(
          and(eq(tutors.tutorId, tutorId), eq(tutors.userId, session.user.id)),
        )
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
    const session = await ensureSession();

    try {
      const [deletedTutor] = await db
        .delete(tutors)
        .where(
          and(eq(tutors.tutorId, tutorId), eq(tutors.userId, session.user.id)),
        )
        .returning();

      if (!deletedTutor) {
        throw new Error();
      }

      return deletedTutor;
    } catch {
      throw new Error(`Tutor ${tutorId} could not be deleted`);
    }
  });

export const importTutors = createServerFn({ method: "POST" }).handler(
  async () => {
    const session = await ensureSession();
    const { importTutorsFromGeneratedIndex } = await import("./import-tutors");
    return await importTutorsFromGeneratedIndex(session.user.id);
  },
);
