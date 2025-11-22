// Fix: Cannot find type definition file for 'vite/client'. Commenting out to resolve error.
// /// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PROD: boolean;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
