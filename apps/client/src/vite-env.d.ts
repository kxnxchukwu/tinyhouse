/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_S_CLIENT_ID: string;
  readonly VITE_S_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
