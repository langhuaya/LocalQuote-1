interface ImportMetaEnv {
  readonly PROD: boolean;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
