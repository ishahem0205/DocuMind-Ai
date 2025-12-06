interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  // add other VITE_... vars here if needed
  [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}