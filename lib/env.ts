function firstDefined(...values: Array<string | undefined>) {
  return values.find((value) => Boolean(value && value.trim()));
}

export function getDatabaseUrl() {
  return (
    firstDefined(
      process.env.TURSO_DATABASE_URL,
      process.env.DATABASE_URL,
    ) ?? "file:.data/spleckt.db"
  );
}

export function getDatabaseAuthToken() {
  return firstDefined(
    process.env.TURSO_AUTH_TOKEN,
    process.env.DATABASE_AUTH_TOKEN,
  );
}

export function getAppUrl() {
  return (
    firstDefined(
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.BETTER_AUTH_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : undefined,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    ) ?? "http://localhost:3000"
  );
}
