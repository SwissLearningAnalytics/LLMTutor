import { createOpenAI } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { and, eq } from "drizzle-orm";
import { createOllama } from "ollama-ai-provider-v2";
import { AiProviders, providerName } from "@/lib/ai/model";
import { getDefaultModelName, isAvailableModel } from "@/lib/ai/resolve-model";
import { createTutorModelMessages } from "@/lib/ai/tutor-chat";
import { db } from "@/lib/db";
import { messages as storedMessages, tutors } from "@/lib/db/schema";

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
  mode: string;
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

const provider = (() => {
  switch (providerName) {
    case AiProviders.Local: {
      const ollama = createOllama({
        baseURL: "http://localhost:11434/api",
      });
      return (model: string) => ollama(model);
    }
    case AiProviders.OpenAI: {
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

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
          mode: string;
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
            columns: { prompt: true },
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

          const result = await streamText({
            model: provider(model),
            messages: await convertToModelMessages(
              createTutorModelMessages(
                data.messages,
                data.shouldStartConversation,
              ),
            ),
            system: tutor.prompt,
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
