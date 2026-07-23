import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hostnameFromHostHeader, isHandoffHostname } from "@/lib/host";

const PASSTHROUGH_PREFIXES = [
  "/api",
  "/_next",
  "/favicon",
  "/editor",
  "/viewer",
];

function shouldPassthrough(pathname: string) {
  return (
    PASSTHROUGH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ) || pathname.includes(".")
  );
}

export function proxy(request: NextRequest) {
  const hostname = hostnameFromHostHeader(request.headers.get("host"));
  const { pathname, search } = request.nextUrl;
  const handoffHost = isHandoffHostname(hostname);

  // Keep /handoff/* invisible on the main Spleckt hosts.
  if (!handoffHost && (pathname === "/handoff" || pathname.startsWith("/handoff/"))) {
    return new NextResponse(null, { status: 404 });
  }

  if (!handoffHost || shouldPassthrough(pathname)) {
    return NextResponse.next();
  }

  // Already rewritten / internal path
  if (pathname === "/handoff" || pathname.startsWith("/handoff/")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/handoff" : `/handoff${pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
