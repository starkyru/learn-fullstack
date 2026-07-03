// Ambient declaration so `tsc --noEmit` accepts the side-effect CSS import in app/layout.tsx.
// (Next/PostCSS handle the actual stylesheet at dev/build time; the type checker just needs
// to know `*.css` is a resolvable module.)
declare module "*.css";
