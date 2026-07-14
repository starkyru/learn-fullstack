export function formatMessage(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (_match, key: string) => {
    if (!(key in values)) throw new Error(`missing message variable: ${key}`);
    return String(values[key]);
  });
}
