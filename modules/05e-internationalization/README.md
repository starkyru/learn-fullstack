# Module 05e — Internationalization, Locales & Time (companion)

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT
> Take after React Core and before either capstone develops user-facing dates, messages, or money.

An application is not internationalized because its strings are translated. It must choose a locale,
format values at the edge, handle plural/variable messages safely, and preserve an instant as UTC
until it is rendered in the viewer's time zone. Build these seams before strings spread through UI.

## Concepts

- **Locale negotiation** — accept an explicitly supported locale, then fall back deterministically;
  a browser preference is a hint, not a permission to emit an unsupported language.
- **Message catalogs** — UI owns stable message ids and interpolation variables; translation text is
  data. Never concatenate translated fragments, because word order and plural rules differ.
- **Time zones** — store an instant, not a local wall-clock string; format it with `Intl.DateTimeFormat`
  for the recipient. Test dates with an explicit locale and time zone.
- **Accessible and RTL UI** — give the page `lang`/`dir`; use logical CSS properties and check that
  labels, error messages, and dates remain understandable when text expands.

## Tasks

| #   | Task                       | Lane | Type | What you build                                                                                                       |
| --- | -------------------------- | ---- | ---- | -------------------------------------------------------------------------------------------------------------------- |
| 1   | Locale fallback            | 🟢   | WE   | solved locale parser + analog `resolveLocale` against supported locales                                              |
| 2   | Message interpolation      | 🟡   | TODO | catalog lookup with named variables; reject missing variables rather than rendering `undefined`                      |
| 3   | Time and RTL capstone pass | 🔴   | FS   | render a board due date in two locales/time zones and make one column use logical CSS properties — no i18n framework |

## Done when

- [ ] `resolveLocale` picks an exact locale, then a language match, then the declared fallback.
- [ ] `formatMessage` substitutes every required named variable and rejects an incomplete call.
- [ ] The Kanban or Chat UI has a locale switch, explicit `lang`/`dir`, and deterministic locale/time-zone tests.

> The exercises use pure functions so they run without a browser. Task 3 binds those functions in a
> capstone. Tests import the gated `solution/`; run `pnpm grade 05e-internationalization` to grade `src/`.
