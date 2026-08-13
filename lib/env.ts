function firstDefined(...values: Array<string | undefined>) {
  return values.find((value) => Boolean(value && value.trim()));
}

export function getDatabaseUrl() {
  const url = firstDefined(
    process.env.TURSO_DATABASE_URL,
    process.env.DATABASE_URL,
  );
  // Treat the example placeholder as unset so local SQLite still works.
  if (!url || url.includes("your-db.turso.io")) {
    return "file:.data/spleckt.db";
  }
  return url;
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

/** Origins allowed to call Better Auth (apex + www + product hosts). */
export function getTrustedOrigins() {
  const appUrl = getAppUrl().replace(/\/$/, "");
  const origins = new Set<string>([
    appUrl,
    "https://spleckt.com",
    "https://www.spleckt.com",
    "https://handoff.spleckt.com",
    "https://menoknow.spleckt.com",
    "https://cubemap.spleckt.com",
    "http://localhost:3000",
    "http://handoff.localhost:3000",
    "http://menoknow.localhost:3000",
    "http://cubemap.localhost:3000",
  ]);

  if (process.env.NEXT_PUBLIC_HANDOFF_URL) {
    origins.add(process.env.NEXT_PUBLIC_HANDOFF_URL.replace(/\/$/, ""));
  }
  if (process.env.NEXT_PUBLIC_MENOKNOW_URL) {
    origins.add(process.env.NEXT_PUBLIC_MENOKNOW_URL.replace(/\/$/, ""));
  }
  if (process.env.NEXT_PUBLIC_CUBEMAP_URL) {
    origins.add(process.env.NEXT_PUBLIC_CUBEMAP_URL.replace(/\/$/, ""));
  }

  try {
    const url = new URL(appUrl);
    if (url.hostname.startsWith("www.")) {
      origins.add(`${url.protocol}//${url.hostname.replace(/^www\./, "")}`);
    } else {
      origins.add(`${url.protocol}//www.${url.hostname}`);
    }

    if (/(?:^|\.)spleckt\.com$/i.test(url.hostname)) {
      origins.add(`${url.protocol}//handoff.spleckt.com`);
      origins.add(`${url.protocol}//menoknow.spleckt.com`);
      origins.add(`${url.protocol}//cubemap.spleckt.com`);
    }

    if (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) {
      const port = url.port ? `:${url.port}` : "";
      origins.add(`${url.protocol}//handoff.localhost${port}`);
      origins.add(`${url.protocol}//menoknow.localhost${port}`);
      origins.add(`${url.protocol}//cubemap.localhost${port}`);
    }
  } catch {
    // ignore invalid app url during build
  }

  return [...origins];
}
