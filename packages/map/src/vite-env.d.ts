/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_PUBLIC_MAPBOX_ACCESS_TOKEN: string;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
