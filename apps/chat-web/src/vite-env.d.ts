// Ambient module so `import styles from "./X.module.css"` typechecks. At runtime Vite scopes the
// class names; under Vitest the import resolves to an empty object (class access → undefined),
// which is harmless because tests never assert on class names.
declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

// Minimal shape of Vite's `import.meta.env` (real types come from `vite/client` once installed).
interface ImportMetaEnv {
  readonly VITE_CHAT_URL?: string;
}
interface ImportMeta {
  readonly env?: ImportMetaEnv;
}
