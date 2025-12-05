import {
  providerName,
  AiProviders,
  AiModels,
  defaultModel,
} from "@/lib/ai/model";
import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createOllama } from "ollama-ai-provider";

const provider = (() => {
  "use server";
  switch (providerName) {
    case AiProviders.Local: {
      const ollama = createOllama({
        baseURL: "http://localhost:11434/api",
      });
      return (...args: Partial<Parameters<typeof ollama>>) =>
        ollama(args[0] ?? AiModels[AiProviders.Local][0], args[1]);
    }
    case AiProviders.OpenAI: {
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      return (...args: Partial<Parameters<typeof openai>>) =>
        openai(args[0] ?? AiModels[AiProviders.OpenAI][0], args[1]);
    }

    default: {
      const exhaustiveCheck: never = providerName;
      return exhaustiveCheck;
    }
  }
})();

export const chatHandler = createServerFn({ method: "POST", response: "raw" })
  .validator(
    (
      options:
        | {
            body: string;
            model?: string;
          }
        | undefined,
    ) => {
      if (!options || !options.body) {
        throw new Error("Invalid options data");
      }
      if (options.model) {
        if (process.env.MODE === "prod") {
          // drop model if we are in production, setting this is only valid in dev
          options.model = undefined;
        } else if (!AiModels[providerName].includes(options.model)) {
          throw Error(
            `Invalid model ${options.model} for provider ${providerName}`,
          );
        }
      }

      return options as { body: string; model?: string };
    },
  )
  .handler(async ({ data }) => {
    const m = JSON.parse(data.body);
    const model = data.model ?? defaultModel;
    try {
      const result = await streamText({
        model: provider(model),
        messages: m.messages,
        ...(providerName === AiProviders.OpenAI && {
          temperature: model.startsWith("gpt-5") ? 1 : 0.6, // for gpt-5 only the default is 1
        }),
        onError: (error) => {
          console.error("Error generating response:", error);
        },
      });

      return result.toDataStreamResponse();
    } catch (e) {
      return new Response("Internal Server Error", { status: 500 });
    }
  });
