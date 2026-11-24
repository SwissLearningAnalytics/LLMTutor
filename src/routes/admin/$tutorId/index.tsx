import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  MessageSquareIcon,
  SearchIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getOwnTutorConversationsOptions,
  getOwnTutorMessagesOptions,
} from "@/lib/api/messages/query-options";
import { getOwnTutorOptions } from "@/lib/api/tutors/query-options";
import { AdminLayout } from "@/routes/admin/-components/admin-layout";
import { ResumeLinkPopover } from "@/routes/admin/-components/resume-link";
import { SegmentedControl } from "@/routes/admin/-components/segmented-control";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const filteredConversations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
    const startOfToday = new Date().setHours(0, 0, 0, 0);

    return conversations.filter((conversation) => {
      if (filter === "resumable" && !conversation.isResumable) {
        return false;
      }
      if (
        filter === "today" &&
        new Date(conversation.lastMessageAt).getTime() < startOfToday
      ) {
        return false;
      }
      return [conversation.pseudonym, conversation.executionId].some((value) =>
        value.toLocaleLowerCase().includes(normalizedQuery),
      );
    });
  }, [searchQuery, filter, conversations]);

  if (!tutor) {
    throw notFound();
  }

  return (
    <AdminLayout title={`Konversationen mit ${tutor.displayName}`}>
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

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-60 flex-1">
            <SearchIcon
              aria-hidden
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-secondary"
            />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Pseudonym oder ID suchen"
              aria-label="Konversationen suchen"
              className="bg-surface-primary pl-10"
            />
          </div>
          <SegmentedControl
            label="Konversationen filtern"
            options={[
              { value: "all", label: "Alle" },
              { value: "today", label: "Heute" },
              { value: "resumable", label: "Fortsetzbar" },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>

        <section className="overflow-hidden rounded-lg border border-border-primary bg-surface-primary shadow-sm">
          {conversations.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-1 p-8 text-center">
              <h2 className="text-lg font-semibold text-primary">
                Noch keine Konversationen
              </h2>
              <p className="text-sm text-secondary">
                Über diesen Tutor wurden bisher keine Nachrichten gesendet.
              </p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-1 p-8 text-center">
              <h2 className="text-lg font-semibold text-primary">
                Keine passenden Konversationen
              </h2>
              <p className="text-sm text-secondary">
                Passe die Suche oder den Filter an.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border-primary">
              {filteredConversations.map((conversation) => (
                <li
                  key={conversation.executionId}
                  className="flex items-center transition-colors hover:bg-surface-background-primary"
                >
                  <Link
                    to="/admin/$tutorId/conversations/$executionId"
                    params={{
                      tutorId,
                      executionId: conversation.executionId,
                    }}
                    className="flex min-w-0 flex-1 items-center justify-between gap-4 p-4 focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
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
                      {conversation.isResumable && (
                        <Badge variant="green">Fortsetzbar</Badge>
                      )}
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
                  {/* outside of the link, a button can't be nested in it */}
                  {conversation.isResumable && (
                    <div className="pr-4">
                      <ResumeLinkPopover
                        tutorId={tutorId}
                        executionId={conversation.executionId}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

type ConversationFilter = "all" | "today" | "resumable";

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
