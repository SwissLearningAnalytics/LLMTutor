import type {
  Annotation,
  AnnotationConfig,
  AnnotationMode,
  AnnotationScale,
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

// keyed by the labels of the former study and non-study mode, so old and new answers share the same keys
const defaultAnnotationTexts: Record<
  string,
  Record<AnnotationScale, AnnotationTexts>
> = {
  isCorrect: {
    "0-10": {
      question:
        "Wie hilfreich ist die Nachricht des Tutors für Ihren Lernfortschritt (0 = gar nicht hilfreich, 10 = sehr hilfreich)?",
      tooltip:
        "Bewerten Sie, ob die Nachricht Ihnen hilft, den Stoff besser zu verstehen oder bei der Aufgabe weiterzukommen.",
    },
    "yes-no": {
      question: "Was der Tutor schreibt, ist nicht ganz richtig.",
      tooltip:
        "Wählen Sie diese Option, wenn die Aussage falsche, ungenaue, verzerrte oder unvollständige Anteile enthält. Fiktive Szenarien, die der Tutor für Fallbeispiele generiert, können ignoriert werden.",
    },
  },
  thoughtAboutIndex: {
    "0-10": {
      question:
        "Wie aktiv haben Sie nachgedacht (0 = gar nicht, 10 = sehr aktiv)?",
      tooltip:
        "Aktives Nachdenken bedeutet, dass Sie sich bewusst mit dem Inhalt auseinandergesetzt haben – etwa indem Sie sich selbst Fragen gestellt, kritisch reflektiert, das Thema mit bereits Gelerntem verknüpft oder an konkrete Beispiele und Praxissituationen gedacht haben. Aktives Nachdenken zahlt sich aus – es verbessert nicht nur Ihr Verständnis, sondern auch Ihren Lernerfolg.",
    },
    "yes-no": {
      question:
        "Für die Antwort habe ich aktiv nachgedacht / Ich wusste die Antwort nicht sofort",
      tooltip:
        "Wählen Sie diese Option, wenn Sie für Ihre Nachricht aktiv nachgedacht haben. Aktives Nachdenken bedeutet, dass Sie sich bewusst mit dem Inhalt auseinandergesetzt haben – etwa indem Sie sich eine Antwort auf eine Frage überlegt, sich selbst Fragen gestellt, kritisch reflektiert, das Thema mit bereits Gelerntem verknüpft oder an konkrete Beispiele und Praxissituationen gedacht haben. Aktives Nachdenken zahlt sich aus – es verbessert nicht nur Ihr Verständnis, sondern auch Ihren Lernerfolg.",
    },
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

// the questions of the former hardcoded study ("required") and non-study ("optional") mode, keyed by label
const legacyQuestions: Record<
  "required" | "optional",
  Record<"ai" | "user", Record<string, string>>
> = {
  required: {
    user: {
      externalResource:
        "Haben Sie für Ihre Antwort externe Ressourcen gebraucht?",
      thoughtAboutIndex:
        "Wie aktiv haben Sie nachgedacht (0 = gar nicht, 10 = sehr aktiv)?",
    },
    ai: {
      isCorrect:
        "Ist die Aussage des Tutors vollständig korrekt (fiktive Szenarien / Resultate ausgenommen)? ",
    },
  },
  optional: {
    user: {
      thoughtAboutIndex:
        "Für die Antwort habe ich aktiv nachgedacht / Ich wusste die Antwort nicht sofort",
    },
    ai: {
      isCorrect: "Was der Tutor schreibt, ist nicht ganz richtig.",
    },
  },
};

/**
 * Resolves the answers stored with a message. Messages stored before annotations were configurable per tutor
 * only contain the values, their questions are looked up in the former hardcoded questions.
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
  // answers stored with a tutor message belong to the questions about the user's own answer and vice versa
  const legacyQuestionsByLabel =
    legacyQuestions[mode === "optional" ? "optional" : "required"][
      role === "ai" ? "user" : "ai"
    ];

  return Object.entries(feedback).map(([key, value]) => {
    if (typeof value === "object") {
      return { key, question: value.question, answer: value.value };
    }
    return {
      key,
      question: legacyQuestionsByLabel[key] ?? key,
      answer:
        typeof value === "boolean" ? (value ? "Ja" : "Nein") : String(value),
    };
  });
}
