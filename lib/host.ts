/** Host helpers for the Handoff training surface (handoff.spleckt.com). */

export function hostnameFromHostHeader(hostHeader: string | null | undefined) {
  if (!hostHeader) return "";
  return hostHeader.split(":")[0]?.toLowerCase() ?? "";
}

export function isHandoffHostname(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === "handoff.spleckt.com" ||
    host === "handoff.localhost" ||
    host.startsWith("handoff.localhost.") ||
    host === "handoff.127.0.0.1"
  );
}

export function getHandoffUrl() {
  const explicit = process.env.NEXT_PUBLIC_HANDOFF_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL;
    if (appUrl) {
      const url = new URL(appUrl);
      if (/(?:^|\.)spleckt\.com$/i.test(url.hostname)) {
        return `${url.protocol}//handoff.spleckt.com`;
      }
      if (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) {
        return `${url.protocol}//handoff.localhost${url.port ? `:${url.port}` : ""}`;
      }
    }
  } catch {
    // ignore
  }

  return "http://handoff.localhost:3000";
}
