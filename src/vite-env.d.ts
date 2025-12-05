/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly PG_CONNECTION_STRING: string;
  readonly OPENAI_API_KEY: string;
  readonly VITE_AI_PROVIDER: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
