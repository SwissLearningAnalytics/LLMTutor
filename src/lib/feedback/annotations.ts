import { nonStudyFeedback, studyFeedback } from "@/lib/feedback/feedback";
import type {
  Annotation,
  AnnotationConfig,
  AnnotationMode,
  AnnotationScale,
  FeedbackField,
  StoredAnnotation,
  StoredAnnotations,
} from "@/lib/feedback/types";

export const annotationModeLabels: Record<AnnotationMode, string> = {
  required: "Pflicht",
  optional: "Freiwillig",
  none: "Keine",
};

export const annotationScaleLabels: Record<AnnotationScale, string> = {
  "yes-no": "Ja/Nein",
  "0-10": "0–10",
};

// the value stored when an optional yes/no annotation is checked
export const YES = "Ja";

export function getScaleOptions(scale: AnnotationScale): string[] {
  switch (scale) {
    case "yes-no":
      return ["Nein", YES];
    case "0-10":
      return Array.from({ length: 11 }, (_, i) => i.toString());
  }
}

type AnnotationTexts = Pick<Annotation, "question" | "tooltip">;

function getTexts(fields: FeedbackField[], label: string): AnnotationTexts {
  const field = fields.find((field) => field.label === label);
  if (!field) {
    throw new Error(`Missing feedback field ${label}`);
  }
  return { question: field.text, tooltip: field.tooltip };
}

// the 0-10 questions of the former study mode and the yes/no statements of the former non-study mode,
// keyed by the former labels, so old and new answers share the same keys
const defaultAnnotationTexts: Record<
  string,
  Record<AnnotationScale, AnnotationTexts>
> = {
  isCorrect: {
    "0-10": getTexts(studyFeedback.ai, "isCorrect"),
    "yes-no": getTexts(nonStudyFeedback.ai, "isCorrect"),
  },
  thoughtAboutIndex: {
    "0-10": getTexts(studyFeedback.user, "thoughtAboutIndex"),
    "yes-no": getTexts(nonStudyFeedback.user, "thoughtAboutIndex"),
  },
};

function getDefaultAnnotation(key: string, scale: AnnotationScale): Annotation {
  return { key, scale, ...defaultAnnotationTexts[key][scale] };
}

export const defaultAnnotationConfig: AnnotationConfig = {
  mode: "required",
  ai: [getDefaultAnnotation("isCorrect", "yes-no")],
  user: [getDefaultAnnotation("thoughtAboutIndex", "0-10")],
};

function isUnchanged(
  value: string | undefined,
  defaultValue: string | undefined,
) {
  return (value ?? "").trim() === (defaultValue ?? "").trim();
}

/**
 * Switches the scale of an annotation. The question and tooltip of a default annotation are replaced with the
 * default texts of the new scale, as long as they weren't edited.
 */
export function switchAnnotationScale(
  annotation: Annotation,
  scale: AnnotationScale,
): Annotation {
  const texts = defaultAnnotationTexts[annotation.key];
  if (!texts) {
    return { ...annotation, scale };
  }

  const previous = texts[annotation.scale];
  const next = texts[scale];
  return {
    ...annotation,
    scale,
    question: isUnchanged(annotation.question, previous.question)
      ? next.question
      : annotation.question,
    tooltip: isUnchanged(annotation.tooltip, previous.tooltip)
      ? next.tooltip
      : annotation.tooltip,
  };
}

export function toStoredAnnotations(
  annotations: Annotation[],
  answers: Record<string, string | undefined>,
): StoredAnnotations {
  return Object.fromEntries(
    annotations.flatMap((annotation) => {
      const value = answers[annotation.key];
      if (value === undefined) {
        return [];
      }
      return [
        [
          annotation.key,
          {
            question: annotation.question,
            scale: annotation.scale,
            value,
          } satisfies StoredAnnotation,
        ],
      ];
    }),
  );
}

export function normalizeAnnotationMode(mode: string | null): AnnotationMode {
  switch (mode) {
    case "required":
    case "optional":
    case "none":
      return mode;
    case "non-study":
      return "optional";
    default:
      // "study" and messages stored before the mode was tracked
      return "required";
  }
}

export type AnnotationResponse = {
  key: string;
  question: string;
  answer: string;
};

// old messages store plain values, newer ones the question and scale alongside the value
export type StoredFeedback = Record<
  string,
  StoredAnnotation | string | number | boolean
>;

function isStoredAnnotation(value: unknown): value is StoredAnnotation {
  return (
    typeof value === "object" &&
    value !== null &&
    "question" in value &&
    "value" in value
  );
}

export function normalizeStoredFeedback(feedback: unknown): StoredFeedback {
  if (!feedback || typeof feedback !== "object" || Array.isArray(feedback)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(feedback).filter(
      (entry): entry is [string, StoredFeedback[string]] =>
        typeof entry[1] === "string" ||
        typeof entry[1] === "number" ||
        typeof entry[1] === "boolean" ||
        isStoredAnnotation(entry[1]),
    ),
  );
}

/**
 * Resolves the answers stored with a message. Messages stored before annotations were configurable per tutor
 * only contain the values, their questions are looked up in the former hardcoded configs.
 */
export function getAnnotationResponses({
  feedback,
  mode,
  role,
}: {
  feedback: StoredFeedback;
  mode: AnnotationMode;
  role: "ai" | "user";
}): AnnotationResponse[] {
  const legacyConfig = mode === "optional" ? nonStudyFeedback : studyFeedback;
  // answers stored with a tutor message belong to the questions about the user's own answer and vice versa
  const legacyFields = role === "ai" ? legacyConfig.user : legacyConfig.ai;
  const legacyQuestionsByLabel = new Map(
    legacyFields.map((field) => [field.label, field.text] as const),
  );

  return Object.entries(feedback).map(([key, value]) => {
    if (typeof value === "object") {
      return { key, question: value.question, answer: value.value };
    }
    return {
      key,
      question: legacyQuestionsByLabel.get(key) ?? key,
      answer:
        typeof value === "boolean" ? (value ? "Ja" : "Nein") : String(value),
    };
  });
}
