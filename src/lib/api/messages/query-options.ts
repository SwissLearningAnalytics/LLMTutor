import { queryOptions } from "@tanstack/react-query";
import {
  getOwnTutorConversation,
  getOwnTutorConversations,
  getOwnTutorMessages,
} from "@/lib/api/messages";

export function getOwnTutorMessagesOptions(tutorId: string) {
  return queryOptions({
    queryKey: ["tutors", "mine", tutorId, "messages"],
    queryFn: () => getOwnTutorMessages({ data: { tutorId } }),
  });
}

export function getOwnTutorConversationsOptions(tutorId: string) {
  return queryOptions({
    queryKey: ["tutors", "mine", tutorId, "conversations"],
    queryFn: () => getOwnTutorConversations({ data: { tutorId } }),
  });
}

export function getOwnTutorConversationOptions(
  tutorId: string,
  executionId: string,
) {
  return queryOptions({
    queryKey: ["tutors", "mine", tutorId, "conversations", executionId],
    queryFn: () => getOwnTutorConversation({ data: { tutorId, executionId } }),
  });
}
