/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_PREVIEW_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
