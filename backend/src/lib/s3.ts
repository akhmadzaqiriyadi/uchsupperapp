import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "node:https";

// Create HTTPS agent that allows self-signed certs (for development)
const agent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === "production",
});

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for MinIO
  requestHandler: new NodeHttpHandler({
    httpsAgent: agent,
  }),
});

const BUCKET = process.env.S3_BUCKET || "uch-connection";

/**
 * Generate S3 key based on organization slug and timestamp
 * Format: artifacts/{org_slug}/{year}/{month}/{timestamp}_{filename}
 */
export function generateS3Key(
  orgSlug: string,
  filename: string
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const timestamp = Date.now();
  
  // Sanitize filename
  const sanitizedFilename = filename
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .toLowerCase();

  return `artifacts/${orgSlug}/${year}/${month}/${timestamp}_${sanitizedFilename}`;
}

/**
 * Upload file to S3/MinIO
 */
export async function uploadToS3(
  key: string,
  body: Buffer | Uint8Array | Blob,
  contentType: string
): Promise<{ key: string; success: boolean }> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await s3Client.send(command);
    return { key, success: true };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error("Failed to upload file to S3");
  }
}

/**
 * Delete file from S3/MinIO
 */
export async function deleteFromS3(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error("S3 delete error:", error);
    return false;
  }
}

/**
 * Generate pre-signed URL for viewing files
 * URL valid for 1 hour by default
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export { s3Client, BUCKET };
