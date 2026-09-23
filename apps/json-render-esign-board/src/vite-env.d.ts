/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JSON_RENDER_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
