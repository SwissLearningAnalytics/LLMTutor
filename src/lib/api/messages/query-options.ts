import { queryOptions } from "@tanstack/react-query";
import { getOwnTutorConversations } from "@/lib/api/messages";

export function getOwnTutorConversationsOptions(tutorId: string) {
  return queryOptions({
    queryKey: ["tutors", "mine", tutorId, "conversations"],
    queryFn: () => getOwnTutorConversations({ data: { tutorId } }),
  });
}
