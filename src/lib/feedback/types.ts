import { z } from "zod";

// legacy structure, only used to resolve the questions of messages stored before annotations were configurable per tutor
export type FeedbackField = {
  label: string;
  text: string;
  tooltip: string;
  options: string[];
};

export type Feedback = {
  user: FeedbackField[];
  ai: FeedbackField[];
  required: boolean;
};

export const annotationModeSchema = z.enum(["required", "optional", "none"]);
export const annotationScaleSchema = z.enum(["yes-no", "0-10"]);

export const annotationSchema = z.object({
  // stable across edits, answers are stored under this key
  key: z.string().min(1),
  question: z.string().trim().min(1, "Die Frage darf nicht leer sein."),
  tooltip: z.string().optional(),
  scale: annotationScaleSchema,
});

export const annotationConfigSchema = z.object({
  mode: annotationModeSchema,
  // shown after a message of the tutor, answers are stored with the following user message
  ai: z.array(annotationSchema),
  // shown after a message of the user, answers are stored with the following tutor message
  user: z.array(annotationSchema),
});

export type AnnotationMode = z.infer<typeof annotationModeSchema>;
export type AnnotationScale = z.infer<typeof annotationScaleSchema>;
export type Annotation = z.infer<typeof annotationSchema>;
export type AnnotationConfig = z.infer<typeof annotationConfigSchema>;

// the question and scale are stored with every answer, so later edits of the tutor don't change past sessions
export type StoredAnnotation = {
  question: string;
  scale: AnnotationScale;
  value: string;
};

export type StoredAnnotations = Record<string, StoredAnnotation>;
