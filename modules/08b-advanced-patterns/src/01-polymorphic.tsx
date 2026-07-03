import type { ComponentPropsWithoutRef, ElementType, ReactElement } from "react";

/**
 * Polymorphic components: one component that renders as ANY host element (or another component)
 * via an `as` prop, while still type-checking the props of whatever it renders as. `<Box as="a">`
 * should accept `href`; `<Box as="button">` should accept `type`/`disabled`; the default (`div`)
 * accepts none of those.
 *
 * WORKED EXAMPLE — `Box` is done for you below; copy its shape to finish `Text`.
 * The type engine is a generic `E extends ElementType` plus `ComponentPropsWithoutRef<E>`:
 *   - `as?: E` picks the element/component.
 *   - `ComponentPropsWithoutRef<E>` is the exact prop set of that element (href for "a", etc.).
 *   - `Omit<…, "as">` keeps our own `as` prop from colliding with the element's props.
 * At runtime it is trivial: read `as` (default the element), spread the REST onto it.
 */

export type PolymorphicProps<E extends ElementType> = {
  as?: E;
} & Omit<ComponentPropsWithoutRef<E>, "as">;

/** A layout primitive. Renders a `div` by default; `as` swaps the element and its prop set. */
export function Box<E extends ElementType = "div">({
  as,
  ...rest
}: PolymorphicProps<E>): ReactElement {
  const Component = (as ?? "div") as ElementType;
  return <Component {...rest} />;
}

/**
 * YOUR TURN — implement `Text`, the analog of `Box`:
 *   1. Default the element to `"span"` (Box defaults to `"div"`).
 *   2. Read `as` off the props; spread the REST onto the chosen element.
 * Keep the generic signature and `ReactElement` return so `<Text as="label" htmlFor="x">` checks.
 */
export function Text<E extends ElementType = "span">(
  _props: PolymorphicProps<E>,
): ReactElement {
  throw new Error(
    "TODO: render the `as` element (default span) spreading the rest props",
  );
}
