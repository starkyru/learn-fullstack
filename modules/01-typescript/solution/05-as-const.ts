export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export function indexOfLevel(level: LogLevel): number {
  return LOG_LEVELS.indexOf(level);
}

export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export function rankOf(priority: Priority): number {
  return PRIORITIES.indexOf(priority) + 1;
}
