import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { ChatMessage } from "@/components/chat/chat-message";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { getOwnTutorConversationOptions } from "@/lib/api/messages/query-options";
import { getOwnTutorOptions } from "@/lib/api/tutors/query-options";
import { AdminHeader } from "@/routes/admin/-components/admin-header";

export const Route = createFileRoute(
  "/admin/$tutorId/conversations/$executionId",
)({
  loader: async ({ context: { queryClient }, params }) => {
    const [tutor, conversation] = await Promise.all([
      queryClient.ensureQueryData(getOwnTutorOptions(params.tutorId)),
      queryClient.ensureQueryData(
        getOwnTutorConversationOptions(params.tutorId, params.executionId),
      ),
    ]);

    if (!tutor || conversation.length === 0) {
      throw notFound();
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { tutorId, executionId } = Route.useParams();
  const { data: tutor } = useSuspenseQuery(getOwnTutorOptions(tutorId));
  const { data: conversation } = useSuspenseQuery(
    getOwnTutorConversationOptions(tutorId, executionId),
  );

  if (!tutor || conversation.length === 0) {
    throw notFound();
  }

  const pseudonym = conversation[0].pseudonym;

  return (
    <Layout
      header={
        <AdminHeader
          title={`Konversation von ${pseudonym} mit ${tutor.displayName}`}
        />
      }
    >
      <div className="flex flex-col gap-8">
        <Button asChild variant="ghost" className="w-fit px-0 text-secondary">
          <Link to="/admin/$tutorId" params={{ tutorId }}>
            <ArrowLeftIcon />
            Zurück zu den Konversationen
          </Link>
        </Button>

        <div>
          {conversation.map((storedMessage) => (
            <div
              key={storedMessage.id}
              className="group mt-6 flex w-full flex-col"
            >
              <ChatMessage
                message={{
                  id: String(storedMessage.id),
                  role: storedMessage.role === "ai" ? "assistant" : "user",
                  parts: [{ type: "text", text: storedMessage.message }],
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
