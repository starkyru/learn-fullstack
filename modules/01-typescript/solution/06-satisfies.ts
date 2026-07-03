type Endpoint = { url: string; timeout: number };

export const SERVICES = {
  auth: { url: "/auth", timeout: 5000 },
  billing: { url: "/billing", timeout: 10000 },
} satisfies Record<string, Endpoint>;

export function endpoint(name: keyof typeof SERVICES): string {
  return SERVICES[name].url;
}

export const THEME = {
  primary: "#2563eb",
  danger: "#dc2626",
} satisfies Record<string, string>;

export function colorOf(name: keyof typeof THEME): string {
  return THEME[name];
}
