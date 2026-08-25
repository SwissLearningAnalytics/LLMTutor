import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  MessageSquareIcon,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getOwnTutorConversationsOptions,
  getOwnTutorMessagesOptions,
} from "@/lib/api/messages/query-options";
import { getOwnTutorOptions } from "@/lib/api/tutors/query-options";
import { AdminHeader } from "@/routes/admin/-components/admin-header";
import {
  downloadCsv,
  getExportFilenameTimestamp,
  getConversationCsvRows,
  sanitizeFilenamePart,
} from "@/routes/admin/-utils/conversation-csv";

export const Route = createFileRoute("/admin/$tutorId/")({
  loader: ({ context: { queryClient }, params }) => {
    queryClient.ensureQueryData(getOwnTutorOptions(params.tutorId));
    queryClient.ensureQueryData(
      getOwnTutorConversationsOptions(params.tutorId),
    );
    queryClient.ensureQueryData(getOwnTutorMessagesOptions(params.tutorId));
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { tutorId } = Route.useParams();
  const { data: tutor } = useSuspenseQuery(getOwnTutorOptions(tutorId));
  const { data: conversations } = useSuspenseQuery(
    getOwnTutorConversationsOptions(tutorId),
  );
  const { data: messages } = useSuspenseQuery(
    getOwnTutorMessagesOptions(tutorId),
  );

  if (!tutor) {
    throw notFound();
  }

  return (
    <Layout
      header={<AdminHeader title={`Konversationen mit ${tutor.displayName}`} />}
    >
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <Button asChild variant="ghost" className="w-fit px-0 text-secondary">
            <Link to="/admin">
              <ArrowLeftIcon />
              Zurück zu den Tutoren
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              downloadCsv(
                getConversationCsvRows(messages, tutor.tutorId),
                `${sanitizeFilenamePart(tutor.displayName)}-tutor-${getExportFilenameTimestamp()}.csv`,
              )
            }
          >
            <DownloadIcon />
            Alle Nachrichten als CSV exportieren
          </Button>
        </div>

        <section className="overflow-hidden rounded-lg border border-border-primary bg-surface-primary shadow-sm">
          {conversations.length > 0 ? (
            <ul className="divide-y divide-border-primary">
              {conversations.map((conversation) => (
                <li key={conversation.executionId}>
                  <Link
                    to="/admin/$tutorId/conversations/$executionId"
                    params={{
                      tutorId,
                      executionId: conversation.executionId,
                    }}
                    className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-background-primary focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <MessageSquareIcon
                          aria-hidden
                          className="size-4 shrink-0 text-secondary"
                        />
                        <h2 className="truncate text-base font-medium text-primary">
                          {conversation.pseudonym}
                        </h2>
                      </div>
                      <p className="truncate text-sm text-secondary">
                        {conversation.executionId}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge variant="gray">
                        {formatMessageCount(conversation.messageCount)}
                      </Badge>
                      <time
                        dateTime={new Date(
                          conversation.lastMessageAt,
                        ).toISOString()}
                        className="text-sm text-secondary"
                      >
                        Zuletzt aktiv: {formatDate(conversation.lastMessageAt)}
                      </time>
                      <ChevronRightIcon
                        aria-hidden
                        className="size-4 text-secondary"
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center gap-1 p-8 text-center">
              <h2 className="text-lg font-semibold text-primary">
                Noch keine Konversationen
              </h2>
              <p className="text-sm text-secondary">
                Über diesen Tutor wurden bisher keine Nachrichten gesendet.
              </p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("de-CH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Zurich",
  }).format(new Date(date));
}

function formatMessageCount(messageCount: number) {
  return messageCount === 1 ? "1 Nachricht" : `${messageCount} Nachrichten`;
}
