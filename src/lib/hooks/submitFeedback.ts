import { addUserMessage, saveReflectionOnOwnAnswer } from "@/lib/api/messages";
import type { TutorSessionCredentials } from "@/lib/api/tutor-sessions";
import type { StoredAnnotations } from "@/lib/feedback/types";

export async function submitUserAnswerWithFeedback({
  promptName,
  session,
  model,
  userAnswer,
  reflectionOnChatbotFeedback,
}: {
  promptName: string;
  session: TutorSessionCredentials;
  model?: string;
  userAnswer: string;
  reflectionOnChatbotFeedback: StoredAnnotations;
}) {
  await addUserMessage({
    data: {
      tutorId: promptName,
      ...session,
      model,
      message: userAnswer,
      feedback: reflectionOnChatbotFeedback,
    },
  });
}

export async function submitSecondFeedback({
  promptName,
  session,
  reflectionOnOwnAnswer,
}: {
  promptName: string;
  session: TutorSessionCredentials;
  reflectionOnOwnAnswer: StoredAnnotations;
}) {
  await saveReflectionOnOwnAnswer({
    data: {
      tutorId: promptName,
      ...session,
      feedback: reflectionOnOwnAnswer,
    },
  });
}
