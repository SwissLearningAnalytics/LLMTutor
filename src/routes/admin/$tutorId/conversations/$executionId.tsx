import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { ChatMessage } from "@/components/chat/chat-message";
import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getOwnTutorConversationOptions } from "@/lib/api/messages/query-options";
import { getOwnTutorOptions } from "@/lib/api/tutors/query-options";
import { nonStudyFeedback, studyFeedback } from "@/lib/feedback/feedback";
import type { FeedbackField, QuestionnaireMode } from "@/lib/feedback/types";
import { cn } from "@/lib/utils/cn";
import { AdminHeader } from "@/routes/admin/-components/admin-header";

const feedbackByMode = {
  study: studyFeedback,
  "non-study": nonStudyFeedback,
} satisfies Record<QuestionnaireMode, typeof studyFeedback>;

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
              <QuestionnaireAnswers
                feedback={storedMessage.feedback}
                mode={storedMessage.mode}
                role={storedMessage.role}
              />
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

function QuestionnaireAnswers({
  feedback,
  mode,
  role,
}: {
  feedback: Record<string, string | number | boolean>;
  mode: QuestionnaireMode;
  role: "ai" | "user";
}) {
  const answers = getQuestionnaireAnswers(feedback);

  if (answers.length === 0) {
    return null;
  }

  const feedbackConfig = feedbackByMode[mode];
  const fields = role === "ai" ? feedbackConfig.user : feedbackConfig.ai;
  const questionsByLabel = new Map(
    fields.map((field) => [field.label, field] as const),
  );

  return (
    <div
      className={cn(
        "mb-2 rounded-lg border bg-white p-4",
        role === "user" && "ml-auto w-1/2",
      )}
    >
      <p className="mb-3 text-sm font-semibold">Antworten auf den Fragebogen</p>
      <dl className="space-y-3">
        {answers.map(([label, answer]) => (
          <QuestionnaireAnswer
            key={label}
            answer={answer}
            field={questionsByLabel.get(label)}
            label={label}
          />
        ))}
      </dl>
    </div>
  );
}

function QuestionnaireAnswer({
  answer,
  field,
  label,
}: {
  answer: string;
  field?: FeedbackField;
  label: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-sm text-secondary">{field?.text ?? label}</dt>
      <dd>
        <Badge variant="blue">{answer}</Badge>
      </dd>
    </div>
  );
}

function getQuestionnaireAnswers(
  feedback: Record<string, string | number | boolean>,
) {
  return Object.entries(feedback).map(([label, value]) => [
    label,
    typeof value === "boolean" ? (value ? "Ja" : "Nein") : String(value),
  ]);
}
