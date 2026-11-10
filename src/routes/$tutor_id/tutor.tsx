import { useChat } from "@ai-sdk/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { CornerDownLeftIcon, RefreshCwIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/components/chat/chat-message";
import { Feedback } from "@/components/feedback/feedback";
import { FeedbackReaction } from "@/components/feedback/feedback-reaction";
import { Layout } from "@/components/layout";
import { AutoResizingTextarea } from "@/components/ui/autoresizing-textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";
import { MemoizedMarkdown } from "@/components/ui/memoized-markdown";
import {
  isInitialAssistantResponse,
  prepareTutorChatMessages,
} from "@/lib/ai/tutor-chat";
import { validateModelSearch } from "@/lib/ai/validate-model-search";
import { getTutorOptions } from "@/lib/api/tutors/query-options";
import { toStoredAnnotations } from "@/lib/feedback/annotations";
import {
  submitSecondFeedback,
  submitUserAnswerWithFeedback,
} from "@/lib/hooks/submitFeedback";
import { usePseudonymStore } from "@/lib/pseudonymStore";
import { Phase } from "@/lib/types/phases";
import { cn } from "@/lib/utils/cn";

const BACKOFF_INITIAL_VALUE = 5 / 2;

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
  const { data: tutor } = useSuspenseQuery(getTutorOptions(tutorId));
  // read once per session, changes of the tutor only affect new sessions
  const [{ mode, ...annotations }] = useState(tutor.annotations);
  const isRequired = mode === "required";
  // without annotations the flow is the same as with optional ones, just without any cards
  const feedbackMode = isRequired ? "required" : "optional";
  const feedback = mode === "none" ? { ai: [], user: [] } : annotations;
  const executionIdRef = useRef(nanoid(10));
  const executionId = executionIdRef.current;
  const [error, setError] = useState(false);
  const [backoff, setBackoff] = useState(BACKOFF_INITIAL_VALUE);
  const [completedAssistantMessage, setCompletedAssistantMessage] = useState<
    UIMessage | undefined
  >();
  const { pseudonym } = usePseudonymStore();
  const { messages, sendMessage, regenerate, status } = useChat({
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest: ({ messages }) => {
        const preparedChat = prepareTutorChatMessages(messages);
        return {
          body: {
            ...preparedChat,
            model,
            tutorId: tutor.tutorId,
            executionId,
            pseudonym,
            mode,
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
      setError(true);
      setBackoff((b) => 2 * b);
      console.error("Error generating response: ", error);
    },
  });
  const lastBotMessage = messages.filter((m) => m.role === "assistant").at(-1);
  const latestMessage = messages.at(-1);
  const navigate = Route.useNavigate();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>(Phase.init);
  const [userAnswer, setUserAnswer] = useState("");
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFeedbackSubmission, setPendingFeedbackSubmission] = useState<
    Record<string, string | undefined> | undefined
  >();

  const [submittedFeedbackMessageId, setSubmittedFeedbackMessageId] = useState<
    string | null
  >(null);
  const [reflectionOnChatbotFeedback, setReflectionOnChatbotFeedback] =
    useState<Record<string, string | undefined>>({});
  const [reflectionOnOwnAnswer, setReflectionOnOwnAnswer] = useState<
    Record<string, string | undefined>
  >({});

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
    if (pseudonym === "") {
      navigate({
        to: "/$tutor_id",
        params: { tutor_id: tutorId },
        search: { model },
      });
    } else if (phase === Phase.init) {
      // deferred because useChat aborts running requests when strict mode simulates an unmount
      const timeout = setTimeout(() => {
        sendMessage({
          role: "system",
          parts: [{ type: "text", text: "Beginne die Unterhaltung." }],
        }).then(() => {
          setPhase(Phase.question_with_feedback);
        });
      });
      return () => clearTimeout(timeout);
    }
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
        pseudonym,
        promptName: tutor.tutorId,
        executionId,
        model,
        message: completedAssistantMessage,
        reflectionOnOwnAnswer: toStoredAnnotations(
          feedback.user,
          feedbackSnapshot,
        ),
        mode,
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
    } catch {
      setShowError(true);
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
        pseudonym,
        model,
        executionId,
        userAnswer,
        reflectionOnChatbotFeedback: toStoredAnnotations(
          feedback.ai,
          reflectionOnChatbotFeedback,
        ),
        mode,
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
    } catch {
      setShowError(true);
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
