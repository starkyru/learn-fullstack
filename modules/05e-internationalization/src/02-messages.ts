/** Replace `{name}` variables from a message catalog. Missing variables must throw. */
export function formatMessage(
  _template: string,
  _values: Record<string, string | number>,
): string {
  throw new Error("TODO: replace each named placeholder and reject a missing value");
}
