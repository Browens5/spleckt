/** Host helpers for Spleckt product surfaces (handoff, menoknow). */

export function hostnameFromHostHeader(hostHeader: string | null | undefined) {
  if (!hostHeader) return "";
  return hostHeader.split(":")[0]?.toLowerCase() ?? "";
}

function matchesProductHostname(hostname: string, product: string) {
  const host = hostname.toLowerCase();
  return (
    host === `${product}.spleckt.com` ||
    host === `${product}.localhost` ||
    host.startsWith(`${product}.localhost.`) ||
    host === `${product}.127.0.0.1`
  );
}

export function isHandoffHostname(hostname: string) {
  return matchesProductHostname(hostname, "handoff");
}

export function isMenoknowHostname(hostname: string) {
  return matchesProductHostname(hostname, "menoknow");
}

function deriveProductUrl(
  product: "handoff" | "menoknow",
  explicitEnv: string | undefined,
  fallbackPortLocal: string,
) {
  const explicit = explicitEnv?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL;
    if (appUrl) {
      const url = new URL(appUrl);
      if (/(?:^|\.)spleckt\.com$/i.test(url.hostname)) {
        return `${url.protocol}//${product}.spleckt.com`;
      }
      if (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) {
        return `${url.protocol}//${product}.localhost${url.port ? `:${url.port}` : ""}`;
      }
    }
  } catch {
    // ignore
  }

  return fallbackPortLocal;
}

export function getHandoffUrl() {
  return deriveProductUrl(
    "handoff",
    process.env.NEXT_PUBLIC_HANDOFF_URL,
    "http://handoff.localhost:3000",
  );
}

export function getMenoknowUrl() {
  return deriveProductUrl(
    "menoknow",
    process.env.NEXT_PUBLIC_MENOKNOW_URL,
    "http://menoknow.localhost:3000",
  );
}
