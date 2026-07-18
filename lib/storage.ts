import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const LOCAL_ROOT = path.join(process.cwd(), ".data", "uploads");

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
  });
}

export function publicAssetUrl(key: string) {
  if (process.env.R2_PUBLIC_URL) {
    return `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  }
  return `/api/files/${key}`;
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

  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: params.key,
    ContentType: params.contentType,
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 * 30 });

  return {
    mode: "r2" as const,
    uploadUrl,
    publicUrl: publicAssetUrl(params.key),
  };
}

export async function putLocalObject(key: string, body: Buffer, contentType: string) {
  const fullPath = path.join(LOCAL_ROOT, key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, body);
  // contentType reserved for future metadata sidecar if needed
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
