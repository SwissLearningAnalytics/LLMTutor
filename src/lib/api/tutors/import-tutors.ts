import { db } from "@/lib/db";
import { type TutorInsert, tutors } from "@/lib/db/schema";
import type { Tutor } from "@/lib/types/tutor";
import { getTutor, tutorIds } from "@/tutors";

export type TutorImportResult = {
  imported: number;
  warnings: string[];
};

function toTutorInsert(tutor: Tutor): Omit<TutorInsert, "userId"> {
  return {
    tutorId: tutor.tutor_id,
    displayName: tutor.displayName,
    prompt: tutor.prompt,
    learningObjectives: tutor.learningObjectives ?? null,
  };
}

function getDuplicateDisplayNameWarnings(tutorRows: TutorInsert[]) {
  const displayNameCounts = new Map<string, string[]>();

  for (const tutor of tutorRows) {
    displayNameCounts.set(tutor.displayName, [
      ...(displayNameCounts.get(tutor.displayName) ?? []),
      tutor.tutorId,
    ]);
  }

  return Array.from(displayNameCounts.entries()).flatMap(
    ([displayName, tutorIds]) => {
      if (tutorIds.length <= 1) {
        return [];
      }

      return [
        `Duplicate displayName "${displayName}" for tutorIds: ${tutorIds.join(", ")}`,
      ];
    },
  );
}

export async function importTutorsFromGeneratedIndex(
  userId: string,
): Promise<TutorImportResult> {
  const tutorRows = await Promise.all(
    tutorIds.map(async (tutorId) => ({
      ...toTutorInsert(await getTutor(tutorId)),
      userId,
    })),
  );
  const warnings = getDuplicateDisplayNameWarnings(tutorRows);

  for (const tutor of tutorRows) {
    await db
      .insert(tutors)
      .values(tutor)
      .onConflictDoUpdate({
        target: tutors.tutorId,
        set: {
          displayName: tutor.displayName,
          prompt: tutor.prompt,
          learningObjectives: tutor.learningObjectives,
        },
      });
  }

  return {
    imported: tutorRows.length,
    warnings,
  };
}
