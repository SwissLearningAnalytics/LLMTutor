import { createOpenAI } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { and, eq } from "drizzle-orm";
import { createOllama } from "ollama-ai-provider-v2";
import { AiProviders, providerName } from "@/lib/ai/model";
import { getDefaultModelName, isAvailableModel } from "@/lib/ai/resolve-model";
import {
  CODE_EXECUTION_INSTRUCTION,
  createTutorModelMessages,
} from "@/lib/ai/tutor-chat";
import { db } from "@/lib/db";
import { messages as storedMessages, tutors } from "@/lib/db/schema";
import type { AnnotationMode } from "@/lib/feedback/types";

async function persistInitialAssistantMessage({
  executionId,
  message,
  mode,
  modelName,
  pseudonym,
  tutorId,
}: {
  executionId: string;
  message: string;
  mode: AnnotationMode;
  modelName: string;
  pseudonym: string;
  tutorId: string;
}) {
  await db.insert(storedMessages).values({
    executionId,
    pseudonym,
    promptName: tutorId,
    modelName,
    role: "ai",
    message,
    feedback: {},
    mode,
  });
}

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
          // annotation mode of the tutor when the session was started
          mode: AnnotationMode;
          pseudonym: string;
          shouldStartConversation: boolean;
          tutorId: string;
        } = await request.json();

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
            system: useCodeExecution
              ? `${tutor.prompt}\n\n${CODE_EXECUTION_INSTRUCTION}`
              : tutor.prompt,
            tools: useCodeExecution
              ? { code_interpreter: openai.tools.codeInterpreter() }
              : undefined,
            allowSystemInMessages: false,
            ...(providerName === AiProviders.OpenAI && {
              temperature: model.startsWith("gpt-5") ? 1 : 0.6, // for gpt-5 only the default is 1
              providerOptions: {
                openai: {
                  reasoningEffort: "none",
                },
              },
            }),
            onFinish: data.shouldStartConversation
              ? async ({ text }) => {
                  await persistInitialAssistantMessage({
                    executionId: data.executionId,
                    message: text,
                    mode: data.mode,
                    modelName: model,
                    pseudonym: data.pseudonym,
                    tutorId: data.tutorId,
                  });
                }
              : undefined,
            onError: (error) => {
              console.error("Error generating response:", error);
            },
          });

          return result.toUIMessageStreamResponse();
        } catch {
          return new Response("Internal Server Error", { status: 500 });
        }
      },
    },
  },
});
