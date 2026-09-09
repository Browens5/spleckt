import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Hostnames we are willing to proxy for Cubemap YouTube downloads. */
const ALLOWED_HOST_SUFFIXES = [
  ".googlevideo.com",
  ".googleusercontent.com",
  ".ytimg.com",
  ".ggpht.com",
];

function isAllowedMediaHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === "googlevideo.com" || host === "youtube.com" || host === "www.youtube.com") {
    return true;
  }
  return ALLOWED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

/**
 * Same-origin proxy for YouTube CDN media URLs.
 * The browser resolves stream URLs with youtubei.js (no yt-dlp); this route
 * only forwards bytes so the client can save them without CORS errors.
 */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "Missing url parameter." }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid media URL." }, { status: 400 });
  }

  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return NextResponse.json({ error: "Unsupported media URL protocol." }, { status: 400 });
  }

  if (!isAllowedMediaHost(target.hostname)) {
    return NextResponse.json(
      { error: "That media host is not allowed for Cubemap YouTube downloads." },
      { status: 400 },
    );
  }

  const headers = new Headers();
  const range = request.headers.get("range");
  if (range) headers.set("Range", range);
  headers.set(
    "User-Agent",
    request.headers.get("user-agent") ??
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );
  headers.set("Accept", "*/*");
  headers.set("Accept-Language", "en-US,en;q=0.9");

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      headers,
      redirect: "follow",
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upstream fetch failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json(
      {
        error: `YouTube CDN returned HTTP ${upstream.status}. The stream URL may have expired — try Save to folder again.`,
      },
      { status: 502 },
    );
  }

  const out = new Headers();
  const contentType = upstream.headers.get("content-type") ?? "video/mp4";
  out.set("Content-Type", contentType);
  out.set("Cache-Control", "no-store");
  out.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");

  const length = upstream.headers.get("content-length");
  if (length) out.set("Content-Length", length);
  const contentRange = upstream.headers.get("content-range");
  if (contentRange) out.set("Content-Range", contentRange);
  const acceptRanges = upstream.headers.get("accept-ranges");
  if (acceptRanges) out.set("Accept-Ranges", acceptRanges);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: out,
  });
}
