export const AiProviders = {
  Local: "ollama-local",
  OpenAI: "openai",
} as const;
export type AiProviders = (typeof AiProviders)[keyof typeof AiProviders];

// only used to seed t_ai_models of a fresh database, the list is maintained by admins afterwards
// first model is seeded as the default
export const seedAiModels = {
  [AiProviders.Local]: ["qwen3.5:latest", "mistral:v0.3", "llama3.3"],
  [AiProviders.OpenAI]: [
    "gpt-5.4",
    "gpt-4.1",
    "gpt-4-turbo",
    "gpt-4o",
    "chatgpt-4o-latest",
    "gpt-3.5-turbo",
    "gpt-5",
    "gpt-5-mini",
  ],
};

export const providerName = (() => {
  const aiProvider = import.meta.env.VITE_AI_PROVIDER;
  if (!aiProvider) {
    if (process.env.NODE_ENV === "production") {
      return AiProviders.OpenAI;
    }
    return AiProviders.Local;
  }

  if (!Object.values(AiProviders).includes(aiProvider as AiProviders)) {
    throw new Error(`Invalid AI provider: ${aiProvider}`);
  }

  return aiProvider as AiProviders;
})();
