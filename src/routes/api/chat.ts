import { createOpenAI } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createOllama } from "ollama-ai-provider-v2";
import {
  AiModels,
  AiProviders,
  defaultModel,
  providerName,
} from "@/lib/ai/model";

const provider = (() => {
  switch (providerName) {
    case AiProviders.Local: {
      const ollama = createOllama({
        baseURL: "http://localhost:11434/api",
      });
      return (...args: Partial<Parameters<typeof ollama>>) =>
        ollama(args[0] ?? AiModels[AiProviders.Local][0]);
    }
    case AiProviders.OpenAI: {
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      return (...args: Partial<Parameters<typeof openai>>) =>
        openai(args[0] ?? AiModels[AiProviders.OpenAI][0]);
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
          messages: UIMessage[];
          model?: string;
          systemPrompt: string;
        } = await request.json();

        if (process.env.MODE === "prod") {
          // drop model if we are in production, setting this is only valid in dev
          data.model = undefined;
        } else if (data.model && !AiModels[providerName].includes(data.model)) {
          throw Error(
            `Invalid model ${data.model} for provider ${providerName}`,
          );
        }

        const model = data.model ?? defaultModel;
        try {
          const result = await streamText({
            model: provider(model),
            messages: await convertToModelMessages(data.messages),
            system: data.systemPrompt,
            ...(providerName === AiProviders.OpenAI && {
              temperature: model.startsWith("gpt-5") ? 1 : 0.6, // for gpt-5 only the default is 1
              providerOptions: {
                openai: {
                  reasoningEffort: "none",
                },
              },
            }),
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
