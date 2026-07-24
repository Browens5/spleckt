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

let corsEnsured = false;

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
      "http://localhost:3000",
      "http://handoff.localhost:3000",
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
  if (!hasR2() || corsEnsured) {
    return { configured: hasR2(), ok: !hasR2() || corsEnsured, error: null as string | null };
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
    corsEnsured = true;
    return { configured: true, ok: true, error: null as string | null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update R2 CORS";
    // Token may lack permission — still report so health/upload can explain.
    return { configured: true, ok: false, error: message };
  }
}

export async function getR2Status() {
  if (!hasR2()) {
    return {
      configured: false,
      corsOk: null as boolean | null,
      corsError: null as string | null,
      bucket: null as string | null,
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

  return {
    configured: true,
    bucket: process.env.R2_BUCKET_NAME ?? null,
    corsOk: cors.ok,
    corsError: cors.error,
    corsReadable,
    publicUrlConfigured: Boolean(process.env.R2_PUBLIC_URL),
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
