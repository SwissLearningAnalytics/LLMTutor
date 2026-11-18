import { useChat } from "@ai-sdk/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { CornerDownLeftIcon, RefreshCwIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/components/chat/chat-message";
import { Feedback } from "@/components/feedback/feedback";
import { FeedbackReaction } from "@/components/feedback/feedback-reaction";
import { Layout } from "@/components/layout";
import Loading from "@/components/loading";
import { AutoResizingTextarea } from "@/components/ui/autoresizing-textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";
import { MemoizedMarkdown } from "@/components/ui/memoized-markdown";
import {
  getResumePhase,
  isInitialAssistantResponse,
  prepareTutorChatMessages,
  type ResumableSession,
  toResumedChatMessages,
} from "@/lib/ai/tutor-chat";
import { validateModelSearch } from "@/lib/ai/validate-model-search";
import {
  getResumableSession,
  startTutorSession,
  type TutorSessionCredentials,
} from "@/lib/api/tutor-sessions";
import { getTutorOptions } from "@/lib/api/tutors/query-options";
import { toStoredAnnotations } from "@/lib/feedback/annotations";
import type { AnnotationMode } from "@/lib/feedback/types";
import {
  submitSecondFeedback,
  submitUserAnswerWithFeedback,
} from "@/lib/hooks/submitFeedback";
import { usePseudonymStore } from "@/lib/pseudonymStore";
import {
  getSessionEndReason,
  type SessionEndReason,
} from "@/lib/tutor-session-errors";
import {
  clearTutorSession,
  readTutorSession,
  type TutorSessionDraft,
  writeTutorSession,
} from "@/lib/tutorSessionStorage";
import { Phase } from "@/lib/types/phases";
import { cn } from "@/lib/utils/cn";

const BACKOFF_INITIAL_VALUE = 5 / 2;
// a reply that is younger than this may still be generating, and is stored by the server when it is done
const REPLY_GRACE_PERIOD_SECONDS = 60;
const REPLY_POLL_INTERVAL_MS = 2000;

async function loadResumableSession(
  tutorId: string,
  credentials: TutorSessionCredentials,
) {
  const load = () => getResumableSession({ data: { tutorId, ...credentials } });

  let session = await load();
  while (
    session.messages.at(-1)?.role === "user" &&
    session.secondsSinceLastActivity < REPLY_GRACE_PERIOD_SECONDS
  ) {
    await new Promise((resolve) => setTimeout(resolve, REPLY_POLL_INTERVAL_MS));
    session = await load();
  }
  return session;
}

type TutorSession = TutorSessionCredentials & {
  pseudonym: string;
  // a resumed session keeps the mode it was started with
  mode: AnnotationMode;
  resumed?: ResumableSession;
  draft?: TutorSessionDraft;
};

type Search = {
  model?: string;
};

export const Route = createFileRoute("/$tutor_id/tutor")({
  component: RouteComponent,
  loaderDeps: ({ search: { model } }) => ({ model }),
  loader: async ({ params, deps, location, context: { queryClient } }) => {
    const tutor = await queryClient.ensureQueryData(
      getTutorOptions(params.tutor_id),
    );
    if (!tutor) {
      throw notFound();
    }
    await validateModelSearch(deps.model, location.pathname);
  },
  validateSearch: (search: Record<string, string>): Search => {
    if (search.model && import.meta.env.MODE === "prod") {
      console.warn("Models can only be configured in the dev environment.");
      return { model: undefined };
    }

    return {
      model: search.model,
    };
  },
});

function RouteComponent() {
  const tutorId = Route.useParams({
    select: (params) => params.tutor_id,
  });
  const { model } = Route.useSearch();
  const { pseudonym } = usePseudonymStore();
  const navigate = Route.useNavigate();
  const [session, setSession] = useState<TutorSession | undefined>();
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [endReason, setEndReason] = useState<SessionEndReason | undefined>();
  const sessionRequested = useRef(false);

  async function openSession() {
    const stored = readTutorSession(tutorId);
    try {
      if (stored) {
        const resumed = await loadResumableSession(tutorId, stored);
        setSession({
          executionId: stored.executionId,
          token: stored.token,
          pseudonym: resumed.pseudonym,
          mode: resumed.mode,
          resumed,
          draft: stored.draft,
        });
        return;
      }

      if (pseudonym === "") {
        navigate({
          to: "/$tutor_id",
          params: { tutor_id: tutorId },
          search: { model },
        });
        return;
      }

      const { mode, ...credentials } = await startTutorSession({
        data: { tutorId, pseudonym },
      });
      writeTutorSession(tutorId, credentials);
      setSession({ ...credentials, pseudonym, mode });
    } catch (error) {
      console.error("Error loading session: ", error);
      const reason = getSessionEndReason(error);
      if (reason) {
        setEndReason(reason);
      } else {
        // a stored session is kept, it can still be resumed once the server is reachable
        setLoadingFailed(true);
      }
    }
  }

  useEffect(() => {
    if (sessionRequested.current) {
      return;
    }
    sessionRequested.current = true;
    void openSession();
  }, []);

  if (endReason) {
    return (
      <SessionEnded
        reason={endReason}
        onRestart={() => {
          clearTutorSession(tutorId);
          navigate({
            to: "/$tutor_id",
            params: { tutor_id: tutorId },
            search: { model },
          });
        }}
      />
    );
  }

  if (loadingFailed) {
    return (
      <div className="grid h-dvh w-full place-items-center">
        <RetryButton
          waitTime={0}
          onClick={() => {
            setLoadingFailed(false);
            void openSession();
          }}
        />
      </div>
    );
  }

  if (!session) {
    return <Loading />;
  }

  return <TutorChat session={session} onSessionEnded={setEndReason} />;
}

function TutorChat({
  session: { executionId, token, mode, resumed, draft },
  onSessionEnded,
}: {
  session: TutorSession;
  onSessionEnded: (reason: SessionEndReason) => void;
}) {
  const tutorId = Route.useParams({
    select: (params) => params.tutor_id,
  });
  const { model } = Route.useSearch();
  const { data: tutor } = useSuspenseQuery(getTutorOptions(tutorId));
  // read once per session, changes of the tutor only affect new sessions
  const [annotations] = useState(tutor.annotations);
  const credentials = { executionId, token };
  const isRequired = mode === "required";
  // without annotations the flow is the same as with optional ones, just without any cards
  const feedbackMode = isRequired ? "required" : "optional";
  const feedback = mode === "none" ? { ai: [], user: [] } : annotations;
  const [resumedMessages] = useState(() =>
    toResumedChatMessages(resumed?.messages ?? []),
  );
  const [error, setError] = useState(false);
  const [backoff, setBackoff] = useState(BACKOFF_INITIAL_VALUE);
  const [completedAssistantMessage, setCompletedAssistantMessage] = useState<
    UIMessage | undefined
  >(() => {
    const latestResumedMessage = resumedMessages.at(-1);
    return latestResumedMessage?.role === "assistant"
      ? latestResumedMessage
      : undefined;
  });
  const { messages, sendMessage, regenerate, status } = useChat({
    messages: resumedMessages,
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest: ({ messages }) => {
        const preparedChat = prepareTutorChatMessages(messages);
        return {
          body: {
            ...preparedChat,
            model,
            tutorId: tutor.tutorId,
            executionId,
            token,
          },
        };
      },
    }),
    experimental_throttle: 100,
    onFinish: ({ message, isAbort, isDisconnect, isError }) => {
      setBackoff(BACKOFF_INITIAL_VALUE);
      if (
        message.role === "assistant" &&
        !isAbort &&
        !isDisconnect &&
        !isError
      ) {
        setCompletedAssistantMessage(message);
      }
    },
    onError: (error) => {
      const reason = getSessionEndReason(error);
      if (reason) {
        onSessionEnded(reason);
        return;
      }
      setError(true);
      setBackoff((b) => 2 * b);
      console.error("Error generating response: ", error);
    },
  });
  const lastBotMessage = messages.filter((m) => m.role === "assistant").at(-1);
  const latestMessage = messages.at(-1);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>(() =>
    resumed
      ? getResumePhase({
          messages: resumed.messages,
          mode,
          hasOwnAnswerQuestions: feedback.user.length > 0,
        })
      : Phase.init,
  );
  const [userAnswer, setUserAnswer] = useState(draft?.userAnswer ?? "");
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFeedbackSubmission, setPendingFeedbackSubmission] = useState<
    Record<string, string | undefined> | undefined
  >();

  const [submittedFeedbackMessageId, setSubmittedFeedbackMessageId] = useState<
    string | null
  >(null);
  const [reflectionOnChatbotFeedback, setReflectionOnChatbotFeedback] =
    useState<Record<string, string | undefined>>(
      draft?.reflectionOnChatbotFeedback ?? {},
    );
  const [reflectionOnOwnAnswer, setReflectionOnOwnAnswer] = useState<
    Record<string, string | undefined>
  >(draft?.reflectionOnOwnAnswer ?? {});

  useEffect(() => {
    writeTutorSession(tutor.tutorId, {
      ...credentials,
      draft: { userAnswer, reflectionOnChatbotFeedback, reflectionOnOwnAnswer },
    });
  }, [userAnswer, reflectionOnChatbotFeedback, reflectionOnOwnAnswer]);

  function handleSubmitError(error: unknown) {
    const reason = getSessionEndReason(error);
    if (reason) {
      onSessionEnded(reason);
    } else {
      setShowError(true);
    }
  }

  const enableInputArea =
    (phase === Phase.question_with_feedback &&
      status === "ready" &&
      (!isRequired ||
        feedback.ai.every((f) => !!reflectionOnChatbotFeedback[f.key]))) ||
    !isRequired;

  const disableSubmitButton =
    Boolean(pendingFeedbackSubmission) ||
    !canSubmit({
      status,
      phase,
      userAnswer,
      reflectionOnChatbotFeedback,
    });

  function canSubmit({
    status,
    phase,
    userAnswer,
    reflectionOnChatbotFeedback,
  }: {
    status: string;
    phase: Phase;
    userAnswer: string;
    reflectionOnChatbotFeedback: Record<string, string | undefined>;
  }) {
    // only one message per tutor reply, the next one has to wait for the answer
    if (
      status !== "ready" ||
      latestMessage?.role !== "assistant" ||
      isSubmitting
    ) {
      return false;
    }

    if (userAnswer.trim().length === 0) {
      return false;
    }

    if (!isRequired) {
      return true;
    }

    if (phase !== Phase.question_with_feedback) {
      return false;
    }
    return feedback.ai.every(
      (annotation) => !!reflectionOnChatbotFeedback[annotation.key],
    );
  }

  useEffect(() => {
    // deferred because useChat aborts running requests when strict mode simulates an unmount
    const timeout = setTimeout(() => {
      if (phase === Phase.init) {
        sendMessage({
          role: "system",
          parts: [{ type: "text", text: "Beginne die Unterhaltung." }],
        }).then(() => {
          setPhase(Phase.question_with_feedback);
        });
      } else if (latestMessage?.role === "user") {
        // the student left before the reply was stored
        regenerate();
      }
    });
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (enableInputArea) {
      inputRef.current?.focus();
    }
  }, [phase, reflectionOnChatbotFeedback, enableInputArea]);

  useEffect(() => {
    const questionnaireCompleted =
      !isRequired ||
      feedback.user.every((field) => !!reflectionOnOwnAnswer[field.key]);

    if (
      phase !== Phase.answer_with_feedback_and_response_hidden ||
      !questionnaireCompleted ||
      latestMessage?.role !== "assistant"
    ) {
      return;
    }

    setPhase(Phase.question_with_feedback);

    if (isRequired) {
      const feedbackSnapshot = { ...reflectionOnOwnAnswer };
      setReflectionOnOwnAnswer({});
      setPendingFeedbackSubmission(feedbackSnapshot);
    }
  }, [reflectionOnOwnAnswer, latestMessage, phase]);

  useEffect(() => {
    if (!pendingFeedbackSubmission || !completedAssistantMessage) {
      return;
    }

    void submitReflectionOnOwnAnswer(pendingFeedbackSubmission);
  }, [pendingFeedbackSubmission, completedAssistantMessage]);

  async function submitReflectionOnOwnAnswer(
    feedbackSnapshot = reflectionOnOwnAnswer,
  ) {
    if (!completedAssistantMessage) {
      return;
    }

    try {
      await submitSecondFeedback({
        promptName: tutor.tutorId,
        session: credentials,
        reflectionOnOwnAnswer: toStoredAnnotations(
          feedback.user,
          feedbackSnapshot,
        ),
      });

      setPendingFeedbackSubmission(undefined);
      setShowError(false);
      // nothing to thank for without annotations
      if (feedback.user.length > 0) {
        setSubmittedFeedbackMessageId(completedAssistantMessage.id);
        setTimeout(() => {
          setSubmittedFeedbackMessageId(null);
        }, 5000);
      }
    } catch (error) {
      handleSubmitError(error);
    }
  }

  async function submitUserMessage() {
    if (disableSubmitButton) {
      return;
    }
    setIsSubmitting(true);

    if (!isRequired) {
      if (!isInitialAssistantResponse(messages)) {
        await submitReflectionOnOwnAnswer();
      }
      setReflectionOnOwnAnswer({});
    }
    try {
      await submitUserAnswerWithFeedback({
        promptName: tutor.tutorId,
        session: credentials,
        model,
        userAnswer,
        reflectionOnChatbotFeedback: toStoredAnnotations(
          feedback.ai,
          reflectionOnChatbotFeedback,
        ),
      });

      setCompletedAssistantMessage(undefined);
      sendMessage({ text: userAnswer });

      setShowError(false);
      setUserAnswer("");
      setReflectionOnChatbotFeedback({});

      if (
        feedback.ai.length > 0 &&
        lastBotMessage &&
        submittedFeedbackMessageId !== lastBotMessage.id
      ) {
        setSubmittedFeedbackMessageId(lastBotMessage.id);
        setTimeout(() => {
          setSubmittedFeedbackMessageId(null);
        }, 5000);
      }
      setPhase(Phase.answer_with_feedback_and_response_hidden);
    } catch (error) {
      handleSubmitError(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Layout
      className="h-full"
      noConstrain={true}
      header={
        <div className="flex flex-col">
          <span>Sokratischer Tutor</span>
        </div>
      }
      sidebox={
        !tutor.learningObjectives ? null : (
          <div className="prose font-semibold">
            <MemoizedMarkdown
              id={`lernziele-${tutor.tutorId}`}
              parts={[
                {
                  type: "text",
                  text: tutor.learningObjectives,
                },
              ]}
            />
          </div>
        )
      }
    >
      <div className="mx-auto flex h-full max-w-7xl flex-col sm:p-6">
        <div className="no-scrollbar flex grow flex-col overflow-auto px-4 sm:px-0">
          {messages.map((message, index) => {
            const isLastMessage = index === messages.length - 1;
            return (
              <div key={message.id} className="group mt-6 flex w-full flex-col">
                {((phase === Phase.answer_with_feedback_and_response_hidden &&
                  message.role !== "user" &&
                  isLastMessage) ||
                  (!isRequired &&
                    phase === Phase.question_with_feedback &&
                    // there is no own answer to reflect on before the user wrote anything
                    !isInitialAssistantResponse(messages) &&
                    isLastMessage)) && (
                  <Feedback
                    annotations={feedback.user}
                    mode={feedbackMode}
                    feedback={reflectionOnOwnAnswer}
                    setFeedback={setReflectionOnOwnAnswer}
                  />
                )}

                <AnimatePresence>
                  {phase === Phase.question_with_feedback &&
                    submittedFeedbackMessageId === message.id &&
                    isRequired && <FeedbackReaction />}
                </AnimatePresence>

                <ChatMessage
                  message={message}
                  blurAssistant={
                    phase === Phase.answer_with_feedback_and_response_hidden &&
                    isLastMessage &&
                    isRequired
                  }
                />
                {isLastMessage &&
                  (status === "submitted" ||
                    (status === "streaming" &&
                      message.parts.at(-1)?.type !== "text")) && (
                    <LoadingDots />
                  )}

                {phase === Phase.question_with_feedback &&
                  status === "ready" &&
                  isLastMessage && (
                    <>
                      <Feedback
                        annotations={feedback.ai}
                        mode={feedbackMode}
                        feedback={reflectionOnChatbotFeedback}
                        setFeedback={setReflectionOnChatbotFeedback}
                      />
                      {showError && (
                        <div className="mt-4 flex items-center justify-center">
                          <Badge variant={"red"} className="px-3">
                            Es ist ein Fehler aufgetreten
                            <Button
                              onClick={() =>
                                pendingFeedbackSubmission
                                  ? submitReflectionOnOwnAnswer(
                                      pendingFeedbackSubmission,
                                    )
                                  : submitUserMessage()
                              }
                              variant={"neutral"}
                              className="ml-2"
                            >
                              <RefreshCwIcon />
                            </Button>
                          </Badge>
                        </div>
                      )}
                    </>
                  )}
                {phase === Phase.answer_with_feedback_and_response_hidden &&
                  submittedFeedbackMessageId === message.id &&
                  isRequired && (
                    <AnimatePresence>
                      <FeedbackReaction />
                    </AnimatePresence>
                  )}
              </div>
            );
          })}

          {error && (
            <RetryButton
              waitTime={backoff}
              onClick={() => {
                setError(false);
                setCompletedAssistantMessage(undefined);
                regenerate();
              }}
            />
          )}
          <div ref={bottomRef} />
        </div>

        <form
          className="grid place-items-end px-4 sm:px-0"
          onSubmit={(event) => {
            event.preventDefault();
            void submitUserMessage();
          }}
        >
          <AutoResizingTextarea
            required
            ref={inputRef}
            value={userAnswer}
            name="transcript"
            disabled={
              isRequired &&
              (status !== "ready" || phase !== "question-with-feedback")
            }
            onChange={(e) => setUserAnswer(e.target.value)}
            className={cn(
              enableInputArea ? "shadow-focus" : "border",
              "max-h-96 min-h-32 cursor-text scroll-pb-16 overflow-auto rounded-md bg-surface-primary p-3 pb-16 text-sm ring-offset-surface-background-primary [grid-area:1/1] focus-within:ring-2 focus-within:ring-black/50 focus-within:ring-offset-2 focus-within:outline-none",
            )}
            textareaClassName="placeholder:text-secondary"
            placeholder={
              phase === Phase.question_with_feedback && status === "ready"
                ? "Antworte hier..."
                : ""
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submitUserMessage();
              }
            }}
          />
          <Button
            variant={"destructive"}
            disabled={disableSubmitButton}
            type="submit"
            className="z-10 m-3 [grid-area:1/1]"
          >
            Submit
            <CornerDownLeftIcon />
          </Button>
        </form>
      </div>
    </Layout>
  );
}

function SessionEnded({
  reason,
  onRestart,
}: {
  reason: SessionEndReason;
  onRestart: () => void;
}) {
  return (
    <div className="grid h-dvh w-full place-items-center p-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <p className="text-base">
          {reason === "replaced"
            ? "Diese Sitzung wurde auf einem anderen Gerät fortgesetzt."
            : "Diese Sitzung ist abgelaufen und kann nicht mehr fortgesetzt werden."}
        </p>
        <Button variant={"destructive"} onClick={onRestart}>
          Neue Sitzung starten
        </Button>
      </div>
    </div>
  );
}

function RetryButton({
  waitTime,
  onClick,
}: {
  waitTime: number;
  onClick: () => void;
}) {
  const [seconds, setSeconds] = useState(waitTime);
  useEffect(() => {
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }

        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <Button
      className="bg-red-100 text-red-600 disabled:opacity-50"
      onClick={onClick}
      disabled={seconds > 0}
    >
      Something went wrong.{" "}
      {seconds > 0 ? `Try again in ${seconds} seconds` : "Click to try again."}
    </Button>
  );
}
