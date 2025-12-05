export const Phase = {
  init: "init",
  question_with_feedback: "question-with-feedback",
  answer_with_feedback_and_response_hidden:
    "answer-with-feedback-and-response-hidden",
  response: "response",
} as const;

export type Phase = (typeof Phase)[keyof typeof Phase];
