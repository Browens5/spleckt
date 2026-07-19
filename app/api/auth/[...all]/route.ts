export const dynamic = "force-dynamic";

import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { ensureSchema } from "@/lib/db/ensure-schema";

const handler = toNextJsHandler(auth);

async function withSchema(
  request: Request,
  method: "GET" | "POST",
) {
  try {
    await ensureSchema();
  } catch (error) {
    console.error("Failed to ensure database schema", error);
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Database is not configured correctly",
        code: "DB_UNAVAILABLE",
      },
      { status: 503 },
    );
  }

  if (method === "GET") return handler.GET(request);
  return handler.POST(request);
}

export async function GET(request: Request) {
  return withSchema(request, "GET");
}

export async function POST(request: Request) {
  return withSchema(request, "POST");
}
