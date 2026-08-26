import { nonStudyFeedback, studyFeedback } from "@/lib/feedback/feedback";
import type { QuestionnaireMode } from "@/lib/feedback/types";

export type ConversationCsvMessage = {
  id: number;
  executionId: string;
  pseudonym: string;
  createdAt: Date | string;
  role: "ai" | "user";
  mode: QuestionnaireMode;
  message: string;
  feedback: Record<string, string | number | boolean>;
};

const feedbackByMode = {
  study: studyFeedback,
  "non-study": nonStudyFeedback,
} satisfies Record<QuestionnaireMode, typeof studyFeedback>;

export const conversationCsvHeader = [
  "Typ",
  "Tutor-ID",
  "Ausführungs-ID",
  "Pseudonym",
  "Nachrichten-ID",
  "Zeitpunkt (Europe/Zurich)",
  "Rolle",
  "Modus",
  "Nachricht",
  "Frage",
  "Antwort",
];

export function getConversationCsvRows(
  messages: ConversationCsvMessage[],
  tutorId: string,
): string[][] {
  const messagesByExecutionId = new Map<string, ConversationCsvMessage[]>();
  for (const message of messages) {
    const conversation = messagesByExecutionId.get(message.executionId) ?? [];
    conversation.push(message);
    messagesByExecutionId.set(message.executionId, conversation);
  }

  return [...messagesByExecutionId.values()].flatMap((conversation) => [
    ...getQuestionnaireCsvRows(conversation[0], tutorId),
    ...conversation.flatMap((message, index) => {
      const followingMessage = conversation[index + 1];
      const messageRow = [
        "Nachricht",
        ...getMessageCsvColumns(message, tutorId),
        "",
        "",
      ];
      const questionnaireRows = followingMessage
        ? getQuestionnaireCsvRows(followingMessage, tutorId, message)
        : [];

      return [messageRow, ...questionnaireRows];
    }),
  ]);
}

export function downloadCsv(rows: string[][], filename: string) {
  const csv = [conversationCsvHeader, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function getExportFilenameTimestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return (
    [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate())].join("-") +
    `_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
  );
}

export function sanitizeFilenamePart(value: string) {
  return (
    value
      .trim()
      .replaceAll(/[^a-zA-Z0-9äöüÄÖÜß_-]+/g, "-")
      .replaceAll(/^-+|-+$/g, "") || "tutor"
  );
}

function getQuestionnaireCsvRows(
  feedbackMessage: ConversationCsvMessage,
  tutorId: string,
  relatedMessage?: ConversationCsvMessage,
): string[][] {
  const responses = getQuestionnaireResponses(feedbackMessage);
  const message = relatedMessage ?? feedbackMessage;
  const messageColumns = getMessageCsvColumns(message, tutorId);

  return responses.map(({ answer, question }) => [
    "Fragebogen",
    ...messageColumns,
    question,
    answer,
  ]);
}

function getQuestionnaireResponses(message: ConversationCsvMessage) {
  const config = feedbackByMode[message.mode];
  const fields = message.role === "ai" ? config.user : config.ai;
  const questionsByLabel = new Map(
    fields.map((field) => [field.label, field.text] as const),
  );

  return Object.entries(message.feedback).map(([label, value]) => ({
    answer:
      typeof value === "boolean" ? (value ? "Ja" : "Nein") : String(value),
    question: questionsByLabel.get(label) ?? label,
  }));
}

function getMessageCsvColumns(
  message: ConversationCsvMessage,
  tutorId: string,
): string[] {
  return [
    tutorId,
    message.executionId,
    message.pseudonym,
    String(message.id),
    formatTimestamp(message.createdAt),
    message.role === "ai" ? "Tutor" : "Nutzer/in",
    message.mode,
    message.message,
  ];
}

function formatTimestamp(date: Date | string) {
  return new Intl.DateTimeFormat("de-CH", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Europe/Zurich",
  }).format(new Date(date));
}

function escapeCsvCell(value: string) {
  const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}
