import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  GetBucketCorsCommand,
  GetObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
  type CORSRule,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getTrustedOrigins } from "@/lib/env";

const LOCAL_ROOT = path.join(process.cwd(), ".data", "uploads");

type CorsState = {
  checked: boolean;
  managed: boolean | null;
  error: string | null;
};

let corsState: CorsState = {
  checked: false,
  managed: null,
  error: null,
};

function isAccessDenied(message: string) {
  return /access denied|not authorized|forbidden|explicit deny/i.test(message);
}

function hasR2() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME,
  );
}

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    // Required for Cloudflare R2 — newer AWS SDK defaults break R2 uploads.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

export function publicAssetUrl(key: string) {
  if (process.env.R2_PUBLIC_URL) {
    return `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  }
  return `/api/files/${key}`;
}

function desiredCorsRules(): CORSRule[] {
  const origins = Array.from(
    new Set([
      ...getTrustedOrigins(),
      "https://www.spleckt.com",
      "https://spleckt.com",
      "https://handoff.spleckt.com",
      "https://menoknow.spleckt.com",
      "https://cubemap.spleckt.com",
      "https://drones.spleckt.com",
      "https://portfolio.spleckt.com",
      "http://localhost:3000",
      "http://handoff.localhost:3000",
      "http://menoknow.localhost:3000",
      "http://cubemap.localhost:3000",
      "http://drones.localhost:3000",
      "http://portfolio.localhost:3000",
    ]),
  );

  return [
    {
      AllowedOrigins: origins,
      AllowedMethods: ["GET", "PUT", "HEAD"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag", "Content-Type", "Content-Length"],
      MaxAgeSeconds: 3600,
    },
  ];
}

/** Best-effort CORS setup so browser PUTs to R2 succeed. */
export async function ensureR2Cors() {
  if (!hasR2()) {
    return {
      configured: false,
      ok: null as boolean | null,
      managed: null as boolean | null,
      error: null as string | null,
    };
  }

  if (corsState.checked) {
    return {
      configured: true,
      ok: corsState.managed === true ? true : null,
      managed: corsState.managed,
      error: corsState.error,
    };
  }

  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME!;

  try {
    await client.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: desiredCorsRules(),
        },
      }),
    );
    corsState = { checked: true, managed: true, error: null };
    return { configured: true, ok: true, managed: true, error: null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update R2 CORS";
    // Object-only tokens cannot change bucket CORS. Dashboard CORS can still be valid.
    const unmanaged = isAccessDenied(message);
    corsState = {
      checked: true,
      managed: unmanaged ? false : null,
      error: message,
    };
    return {
      configured: true,
      ok: null,
      managed: unmanaged ? false : null,
      error: message,
    };
  }
}

async function probePublicUrl() {
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "") || null;
  if (!publicUrl) {
    return { publicUrl: null, publicUrlReachable: null as boolean | null };
  }

  try {
    const response = await fetch(publicUrl, {
      method: "GET",
      redirect: "follow",
    });
    return {
      publicUrl,
      publicUrlReachable: response.status < 500,
    };
  } catch {
    return { publicUrl, publicUrlReachable: false };
  }
}

export async function getR2Status() {
  if (!hasR2()) {
    return {
      configured: false,
      corsOk: null as boolean | null,
      corsManaged: null as boolean | null,
      corsError: null as string | null,
      corsReadable: null as boolean | null,
      bucket: null as string | null,
      publicUrl: null as string | null,
      publicUrlConfigured: false,
      publicUrlReachable: null as boolean | null,
    };
  }

  const cors = await ensureR2Cors();
  let corsReadable: boolean | null = null;
  try {
    const client = getR2Client();
    await client.send(
      new GetBucketCorsCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
      }),
    );
    corsReadable = true;
  } catch {
    corsReadable = false;
  }

  const publicProbe = await probePublicUrl();

  return {
    configured: true,
    bucket: process.env.R2_BUCKET_NAME ?? null,
    corsOk: cors.ok,
    corsManaged: cors.managed,
    corsError: cors.error,
    corsReadable,
    publicUrlConfigured: Boolean(process.env.R2_PUBLIC_URL),
    ...publicProbe,
  };
}

export async function createUploadUrl(params: {
  key: string;
  contentType: string;
}) {
  if (!hasR2()) {
    return {
      mode: "local" as const,
      uploadUrl: `/api/upload/local?key=${encodeURIComponent(params.key)}`,
      publicUrl: publicAssetUrl(params.key),
    };
  }

  // Ensure browser uploads from the site origin are allowed.
  await ensureR2Cors();

  const client = getR2Client();
  // Keep ContentType out of the signature — empty File.type vs octet-stream
  // mismatches are a common cause of SignatureDoesNotMatch / opaque fetch errors.
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: params.key,
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 * 30 });

  return {
    mode: "r2" as const,
    uploadUrl,
    publicUrl: publicAssetUrl(params.key),
    contentType: params.contentType,
  };
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  if (!hasR2()) {
    return putLocalObject(key, body, contentType);
  }

  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return publicAssetUrl(key);
}

export async function putLocalObject(
  key: string,
  body: Buffer,
  contentType: string,
) {
  const fullPath = path.join(LOCAL_ROOT, key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, body);
  void contentType;
  return publicAssetUrl(key);
}

export async function getLocalObject(key: string) {
  const fullPath = path.join(LOCAL_ROOT, key);
  return readFile(fullPath);
}

export async function getObjectBuffer(key: string) {
  if (!hasR2()) {
    return getLocalObject(key);
  }

  const client = getR2Client();
  const result = await client.send(
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }),
  );
  const bytes = await result.Body?.transformToByteArray();
  if (!bytes) throw new Error("Empty object body");
  return Buffer.from(bytes);
}

export function isR2Configured() {
  return hasR2();
}
