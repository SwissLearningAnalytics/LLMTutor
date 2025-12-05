export const AiProviders = {
  Local: "ollama-local",
  OpenAI: "openai",
} as const;
export type AiProviders = (typeof AiProviders)[keyof typeof AiProviders];

// first model is the default, i.e., the one that is normally used
export const AiModels = {
  [AiProviders.Local]: ["mistral:v0.3", "llama3.3"],
  [AiProviders.OpenAI]: [
    "gpt-4.1",
    "gpt-4-turbo",
    "gpt-4o",
    "chatgpt-4o-latest",
    "gpt-3.5-turbo",
    "gpt-5",
    "gpt-5-mini",
  ],
};
export type AiModels = (typeof AiModels)[keyof typeof AiModels];

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

export const defaultModel = AiModels[providerName][0];
