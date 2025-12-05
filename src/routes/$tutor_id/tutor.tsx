import { Feedback } from "@/components/feedback/feedback";
import { FeedbackReaction } from "@/components/feedback/feedback-reaction";
import { Layout } from "@/components/layout";
import { AutoResizingTextarea } from "@/components/ui/autoresizing-textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";
import { MemoizedMarkdown } from "@/components/ui/memoized-markdown";
import { chatHandler } from "@/lib/ai/chat";
import { AiModels, providerName } from "@/lib/ai/model";
import { nonStudyFeedback, studyFeedback } from "@/lib/feedback/feedback";
import {
  submitSecondFeedback,
  submitUserAnswerWithFeedback,
} from "@/lib/hooks/submitFeedback";
import { usePseudonymStore } from "@/lib/pseudonymStore";
import { getTutor, tutorIds } from "@/tutors";
import { Phase } from "@/lib/types/phases";
import { Role } from "@/lib/types/role";
import { cn } from "@/lib/utils/cn";
import { useIsStudyMode } from "@/lib/utils/use-is-study-mode";
import { useChat } from "@ai-sdk/react";
import { ClientOnly, createFileRoute, notFound } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeftIcon, RefreshCwIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";

const BACKOFF_INITIAL_VALUE = 5 / 2;

type Search = {
  model?: string;
};

export const Route = createFileRoute("/$tutor_id/tutor")({
  component: () => (
    <ClientOnly fallback={<LoadingDots />}>
      <RouteComponent />
    </ClientOnly>
  ),
  beforeLoad: ({ params }) => {
    if (!tutorIds.includes(params.tutor_id)) {
      throw notFound();
    }
  },
  loader: async ({ params }) => {
    try {
      return await getTutor(params.tutor_id);
    } catch (error) {
      console.error("Error loading tutor:", error);
      throw notFound();
    }
  },
  validateSearch: (search: Record<string, string>): Search => {
    if (search.model) {
      if (import.meta.env.MODE === "prod") {
        console.warn("Models can only be configured in the dev environment.");
        return { model: undefined };
      }

      if (!AiModels[providerName].includes(search.model)) {
        if (typeof window !== "undefined") {
          alert(
            `Model ${search.model} is not supported. Supported models are: ${AiModels[providerName].join(", ")}`,
          );
        }
        return { model: undefined };
      }
    }

    return {
      model: search.model,
    };
  },
});

function RouteComponent() {
  const isStudyMode = useIsStudyMode();
  const feedback = isStudyMode ? studyFeedback : nonStudyFeedback;
  const tutorId = Route.useParams({
    select: (params) => params.tutor_id,
  });
  const { model } = Route.useSearch();
  const tutor = Route.useLoaderData();
  const executionIdRef = useRef(nanoid(10));
  const executionId = executionIdRef.current;
  const [error, setError] = useState(false);
  const [backoff, setBackoff] = useState(BACKOFF_INITIAL_VALUE);
  const { messages, setMessages, reload, status } = useChat({
    fetch: (_, init) =>
      chatHandler({
        data: {
          body: init?.body as string,
          model: model, // normally undefined, will use default model
        },
        signal: init?.signal ?? undefined,
      }),
    experimental_throttle: 100,
    onFinish: () => {
      setBackoff(BACKOFF_INITIAL_VALUE);
    },
    onError: (error) => {
      setError(true);
      setBackoff((b) => 2 * b);
      console.error("Error generating response: ", error);
    },
  });
  const lastBotMessage = messages.filter((m) => m.role !== Role.User).at(-1);
  const { pseudonym } = usePseudonymStore();
  const navigate = Route.useNavigate();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>(Phase.init);
  const [userAnswer, setUserAnswer] = useState("");
  const [showError, setShowError] = useState(false);
  const mode = isStudyMode ? "study" : "non-study";

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
      (!isStudyMode ||
        feedback.ai.every((f) => !!reflectionOnChatbotFeedback[f.label]))) ||
    !isStudyMode;

  const disableSubmitButton = !canSubmit({
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
    reflectionOnChatbotFeedback: {
      isCorrect?: boolean;
      isSuitable?: boolean;
    };
  }) {
    if (status === "streaming") {
      return false;
    }

    if (!isStudyMode) {
      return true;
    }

    if (phase !== Phase.question_with_feedback) {
      return false;
    }
    if (userAnswer.length === 0) {
      return false;
    }
    if (reflectionOnChatbotFeedback.isCorrect === undefined) {
      return false;
    }
    if (reflectionOnChatbotFeedback.isSuitable === undefined) {
      return false;
    }
    return true;
  }

  useEffect(() => {
    if (pseudonym === "") {
      navigate({
        to: "/$tutor_id",
        params: { tutor_id: tutorId },
        search: { model },
      });
    } else if (phase === Phase.init) {
      // Send the hidden prompt to AI (never rendered in the UI)
      setMessages([
        {
          id: nanoid(),
          role: Role.User,
          content: tutor.prompt,
        },
      ]);
      reload();
      setPhase(Phase.question_with_feedback);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (enableInputArea) {
      inputRef.current?.focus();
    }
  }, [phase, reflectionOnChatbotFeedback]);

  useEffect(() => {
    if (
      (!isStudyMode ||
        feedback.user.every((f) => !!reflectionOnOwnAnswer[f.label])) &&
      phase === Phase.answer_with_feedback_and_response_hidden
    ) {
      if (lastBotMessage && !isStudyMode) {
        setPhase(Phase.question_with_feedback);
      }
      if (
        isStudyMode &&
        status === "ready" &&
        lastBotMessage &&
        submittedFeedbackMessageId !== lastBotMessage.id
      ) {
        submitReflectionOnOwnAnswer();
      }
    }
  }, [reflectionOnOwnAnswer, status, lastBotMessage, phase]);

  async function submitReflectionOnOwnAnswer() {
    try {
      await submitSecondFeedback({
        pseudonym,
        promptName: tutor.tutor_id,
        executionId,
        model,
        messages,
        reflectionOnOwnAnswer,
        mode,
      });
      setPhase(Phase.question_with_feedback);
      if (isStudyMode) {
        setReflectionOnOwnAnswer({
          externalResource: undefined,
          thoughtAboutIndex: undefined,
        });
      }

      if (lastBotMessage) {
        setSubmittedFeedbackMessageId(lastBotMessage.id);
      }
      setShowError(false);
      setTimeout(() => {
        setSubmittedFeedbackMessageId(null);
      }, 5000);
    } catch {
      setShowError(true);
    }
  }

  async function submitUserMessage(event: React.FormEvent) {
    if (!isStudyMode) {
      submitReflectionOnOwnAnswer();
      setReflectionOnOwnAnswer({
        externalResource: undefined,
        thoughtAboutIndex: undefined,
      });
    }
    try {
      await submitUserAnswerWithFeedback({
        event,
        promptName: tutor.tutor_id,
        pseudonym,
        model,
        executionId,
        userAnswer,
        reflectionOnChatbotFeedback,
        messages,
        setMessages,
        mode,
      });
      setShowError(false);
      setUserAnswer("");
      setReflectionOnChatbotFeedback({
        isCorrect: undefined,
        isSuitable: undefined,
      });

      if (lastBotMessage && submittedFeedbackMessageId !== lastBotMessage.id) {
        setSubmittedFeedbackMessageId(lastBotMessage.id);
        setTimeout(() => {
          setSubmittedFeedbackMessageId(null);
        }, 5000);
      }
      setPhase(Phase.answer_with_feedback_and_response_hidden);

      reload();
    } catch {
      setShowError(true);
    }
  }

  return (
    <Layout
      noConstrain={true}
      header={
        <div className="flex flex-col">
          <span>Sokratischer Tutor</span>
        </div>
      }
      sidebox={
        <div className="prose font-semibold">
          <MemoizedMarkdown
            id={`lernziele-${tutor.tutor_id}`}
            content={tutor.learningObjectives || "Keine Lernziele definiert."}
          />
        </div>
      }
    >
      <div className="mx-auto flex h-full max-w-7xl flex-col sm:p-6">
        <div className="no-scrollbar flex flex-grow flex-col overflow-auto px-4 sm:px-0">
          {status === "submitted" && messages.length === 1 && <LoadingDots />}
          {messages
            .filter((msg) => msg.content !== tutor.prompt)
            .map((message, index) => {
              const isLastMessage = index === messages.length - 2;
              const isFirstMessage = index === 0;

              return (
                <div
                  key={message.id}
                  className={cn("mt-6 flex w-full flex-col")}
                >
                  {((phase === Phase.answer_with_feedback_and_response_hidden &&
                    message.role !== Role.User &&
                    isLastMessage) ||
                    (!isStudyMode &&
                      phase === Phase.question_with_feedback &&
                      !isFirstMessage &&
                      isLastMessage)) && (
                    <>
                      <Feedback
                        feedbackFields={feedback.user}
                        feedback={reflectionOnOwnAnswer}
                        setFeedback={setReflectionOnOwnAnswer}
                      />
                      {showError && (
                        <div className="flex items-center justify-center">
                          <Badge variant={"red"} className="px-3">
                            Es ist ein Fehler aufgetreten
                            <Button
                              onClick={() => submitReflectionOnOwnAnswer()}
                              variant={"neutral"}
                              className="ml-3"
                            >
                              <RefreshCwIcon />
                            </Button>
                          </Badge>
                        </div>
                      )}
                    </>
                  )}

                  <AnimatePresence>
                    {phase === Phase.question_with_feedback &&
                      submittedFeedbackMessageId === message.id &&
                      isStudyMode && <FeedbackReaction />}
                  </AnimatePresence>

                  {message.role === Role.User ? (
                    <motion.div layout={false}>
                      <div
                        className={cn(
                          "prose !max-w-none overflow-auto rounded-lg border border-primary bg-surface-feedback-neutral-light p-4 text-base leading-6",
                          "ml-auto w-1/2",
                        )}
                      >
                        <MemoizedMarkdown
                          id={message.id}
                          content={message.content}
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div layout={false}>
                      <div
                        className={cn(
                          "prose mb-4 mt-8 !max-w-full overflow-auto rounded-lg border text-base font-bold leading-6 text-secondary shadow",
                          "bg-white p-4",
                          phase ===
                            Phase.answer_with_feedback_and_response_hidden &&
                            isLastMessage &&
                            message.role === "assistant" &&
                            isStudyMode &&
                            "blur-sm",
                        )}
                      >
                        <MemoizedMarkdown
                          id={message.id}
                          content={message.content}
                        />
                      </div>
                    </motion.div>
                  )}
                  {status === "submitted" && isLastMessage && <LoadingDots />}

                  {phase === Phase.question_with_feedback &&
                    status === "ready" &&
                    isLastMessage && (
                      <>
                        <Feedback
                          feedbackFields={feedback.ai}
                          feedback={reflectionOnChatbotFeedback}
                          setFeedback={setReflectionOnChatbotFeedback}
                        />
                        {showError && (
                          <div className="mt-4 flex items-center justify-center">
                            <Badge variant={"red"} className="px-3">
                              Es ist ein Fehler aufgetreten
                              <Button
                                onClick={(event) => submitUserMessage(event)}
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
                    isStudyMode && (
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
                reload();
              }}
            />
          )}
          <div ref={bottomRef} />
        </div>

        <form
          className="grid place-items-end px-4 sm:px-0"
          onSubmit={(event) => submitUserMessage(event)}
        >
          <AutoResizingTextarea
            required
            ref={inputRef}
            value={userAnswer}
            name="transcript"
            disabled={
              isStudyMode &&
              (status !== "ready" || phase !== "question-with-feedback")
            }
            onChange={(e) => setUserAnswer(e.target.value)}
            className={cn(
              enableInputArea ? "shadow-focus" : "border",
              "max-h-96 min-h-32 cursor-text scroll-pb-16 overflow-auto rounded-md bg-surface-primary p-3 pb-16 text-sm ring-offset-surface-background-primary [grid-area:1/1] focus-within:outline-none focus-within:ring-2 focus-within:ring-black/50 focus-within:ring-offset-2",
            )}
            textareaClassName="placeholder:text-secondary"
            placeholder={
              phase === Phase.question_with_feedback && status === "ready"
                ? "Antworte hier..."
                : ""
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !disableSubmitButton
              ) {
                submitUserMessage(event);
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
