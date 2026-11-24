import { createOpenAI } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { and, desc, eq } from "drizzle-orm";
import { createOllama } from "ollama-ai-provider-v2";
import { AiProviders, providerName } from "@/lib/ai/model";
import { getDefaultModelName, isAvailableModel } from "@/lib/ai/resolve-model";
import {
  CODE_EXECUTION_INSTRUCTION,
  createTutorModelMessages,
} from "@/lib/ai/tutor-chat";
import { db } from "@/lib/db";
import {
  messages as storedMessages,
  type TutorSessionSelect,
  tutors,
} from "@/lib/db/schema";
import { verifyTutorSession } from "@/lib/tutor-session-auth";

async function persistAssistantMessage({
  executionId,
  message,
  modelName,
  session,
  tutorId,
}: {
  executionId: string;
  message: string;
  modelName: string;
  session: TutorSessionSelect;
  tutorId: string;
}) {
  const [latestMessage] = await db
    .select({ id: storedMessages.id, role: storedMessages.role })
    .from(storedMessages)
    .where(
      and(
        eq(storedMessages.promptName, tutorId),
        eq(storedMessages.executionId, executionId),
      ),
    )
    .orderBy(desc(storedMessages.id))
    .limit(1);

  // a retry after a lost connection replaces the reply that was saved but never fully reached the student
  if (latestMessage?.role === "ai") {
    await db
      .update(storedMessages)
      .set({ message, modelName })
      .where(eq(storedMessages.id, latestMessage.id));
    return;
  }

  await db.insert(storedMessages).values({
    executionId,
    pseudonym: session.pseudonym,
    promptName: tutorId,
    modelName,
    role: "ai",
    message,
    feedback: {},
    mode: session.mode,
  });
}

const MAX_CODE_INTERPRETER_CALLS = 5;

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const provider = (() => {
  switch (providerName) {
    case AiProviders.Local: {
      const ollama = createOllama({
        baseURL: "http://localhost:11434/api",
      });
      return (model: string) => ollama(model);
    }
    case AiProviders.OpenAI: {
      return (model: string) => openai(model);
    }

    default: {
      const exhaustiveCheck: never = providerName;
      return exhaustiveCheck;
    }
  }
})();

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const data: {
          executionId: string;
          messages: UIMessage[];
          model?: string;
          shouldStartConversation: boolean;
          token: string;
          tutorId: string;
        } = await request.json();

        let session: TutorSessionSelect;
        try {
          session = await verifyTutorSession({ ...data, touch: true });
        } catch (error) {
          return new Response((error as Error).message, { status: 403 });
        }

        if (process.env.MODE === "prod") {
          // drop model if we are in production, setting this is only valid in dev
          data.model = undefined;
        } else if (data.model && !(await isAvailableModel(data.model))) {
          return new Response(
            `Invalid model ${data.model} for provider ${providerName}`,
            { status: 400 },
          );
        }

        try {
          const tutor = await db.query.tutors.findFirst({
            columns: { prompt: true, codeExecutionEnabled: true },
            with: { model: { columns: { name: true } } },
            where: and(
              eq(tutors.tutorId, data.tutorId),
              eq(tutors.published, true),
            ),
          });
          if (!tutor) {
            return new Response("Tutor not found", { status: 404 });
          }

          // the model is read on every request, so changing a tutor's model also affects running sessions
          const model =
            data.model ?? tutor.model?.name ?? (await getDefaultModelName());

          // the code interpreter is hosted by openai, so it is not available locally
          const useCodeExecution =
            tutor.codeExecutionEnabled && providerName === AiProviders.OpenAI;

          const result = await streamText({
            model: provider(model),
            messages: await convertToModelMessages(
              createTutorModelMessages(
                data.messages,
                data.shouldStartConversation,
              ),
            ),
            instructions: useCodeExecution
              ? `${tutor.prompt}\n\n${CODE_EXECUTION_INSTRUCTION}`
              : tutor.prompt,
            tools: useCodeExecution
              ? {
                  code_interpreter: openai.tools.codeInterpreter({
                    container: {
                      memoryLimit: "1g",
                      networkPolicy: { type: "disabled" },
                    },
                  }),
                }
              : undefined,
            allowSystemInMessages: false,
            ...(providerName === AiProviders.OpenAI && {
              temperature: model.startsWith("gpt-5") ? 1 : 0.6, // for gpt-5 only the default is 1
              providerOptions: {
                openai: {
                  reasoningEffort: "none",
                  maxToolCalls: useCodeExecution
                    ? MAX_CODE_INTERPRETER_CALLS
                    : undefined,
                },
              },
            }),
            onEnd: async ({ text }) => {
              await persistAssistantMessage({
                executionId: data.executionId,
                message: text,
                modelName: model,
                session,
                tutorId: data.tutorId,
              });
            },
            onError: (error) => {
              console.error("Error generating response:", error);
            },
          });

          // keeps generating if the student disconnects, so the reply is stored when the session is resumed
          const [responseStream, backgroundStream] = result.stream.tee();
          void backgroundStream.pipeTo(new WritableStream()).catch(() => {});

          return createUIMessageStreamResponse({
            stream: toUIMessageStream({ stream: responseStream }),
          });
        } catch {
          return new Response("Internal Server Error", { status: 500 });
        }
      },
    },
  },
});
