const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function safeLimit(value: string | undefined, defaultValue: number = DEFAULT_LIMIT, max: number = MAX_LIMIT): number {
  const parsed = value ? parseInt(value, 10) : defaultValue;
  if (isNaN(parsed) || parsed < 1) return defaultValue;
  return Math.min(parsed, max);
}
