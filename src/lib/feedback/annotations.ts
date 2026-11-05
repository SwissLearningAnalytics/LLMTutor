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

function toAnnotation(field: FeedbackField): Annotation {
  return {
    key: field.label,
    question: field.text,
    tooltip: field.tooltip,
    scale: field.options.length > 2 ? "0-10" : "yes-no",
  };
}

// keeps the labels of the former study questions, so old and new answers share the same keys
export const defaultAnnotationConfig: AnnotationConfig = {
  mode: "required",
  ai: studyFeedback.ai.map(toAnnotation),
  user: studyFeedback.user.map(toAnnotation),
};

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
