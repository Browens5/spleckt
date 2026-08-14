import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  hostnameFromHostHeader,
  isCubemapHostname,
  isDronesHostname,
  isHandoffHostname,
  isMenoknowHostname,
  type ProductHost,
} from "@/lib/host";

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

function hideInternalPath(
  pathname: string,
  product: ProductHost,
  onProductHost: boolean,
) {
  if (onProductHost) return false;
  return pathname === `/${product}` || pathname.startsWith(`/${product}/`);
}

function rewriteToProduct(
  request: NextRequest,
  pathname: string,
  search: string,
  product: ProductHost,
) {
  if (pathname === `/${product}` || pathname.startsWith(`/${product}/`)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${product}` : `/${product}${pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

export function proxy(request: NextRequest) {
  const hostname = hostnameFromHostHeader(request.headers.get("host"));
  const { pathname, search } = request.nextUrl;
  const handoffHost = isHandoffHostname(hostname);
  const menoknowHost = isMenoknowHostname(hostname);
  const cubemapHost = isCubemapHostname(hostname);
  const dronesHost = isDronesHostname(hostname);

  // Keep product paths invisible on the main Spleckt hosts.
  if (hideInternalPath(pathname, "handoff", handoffHost)) {
    return new NextResponse(null, { status: 404 });
  }
  if (hideInternalPath(pathname, "menoknow", menoknowHost)) {
    return new NextResponse(null, { status: 404 });
  }
  if (hideInternalPath(pathname, "cubemap", cubemapHost)) {
    return new NextResponse(null, { status: 404 });
  }
  if (hideInternalPath(pathname, "drones", dronesHost)) {
    return new NextResponse(null, { status: 404 });
  }

  if (shouldPassthrough(pathname)) {
    return NextResponse.next();
  }

  if (handoffHost) {
    return rewriteToProduct(request, pathname, search, "handoff");
  }

  if (menoknowHost) {
    return rewriteToProduct(request, pathname, search, "menoknow");
  }

  if (cubemapHost) {
    return rewriteToProduct(request, pathname, search, "cubemap");
  }

  if (dronesHost) {
    return rewriteToProduct(request, pathname, search, "drones");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
