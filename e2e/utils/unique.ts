/** Unique, human-readable suffix so entities created by different test runs never collide. */
export function uniqueSuffix(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function uniqueName(prefix: string): string {
  return `${prefix} ${uniqueSuffix()}`;
}
