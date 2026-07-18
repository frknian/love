import { S3Client } from "@aws-sdk/client-s3";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_PREFIX = "r2:";

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

let client: S3Client | null = null;

function getR2Client() {
  const config = getR2Config();
  if (!config) throw new Error("R2 storage is not configured.");
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return { client, bucket: config.bucket };
}

export function isR2Configured() {
  return Boolean(getR2Config());
}

export function toR2Path(key: string) {
  return `${R2_PREFIX}${key}`;
}

export function isR2Path(path: string | null | undefined): path is string {
  return Boolean(path?.startsWith(R2_PREFIX));
}

export function fromR2Path(path: string) {
  return path.slice(R2_PREFIX.length);
}

export async function createR2UploadUrl(
  key: string,
  contentType: string,
  expiresIn = 900,
) {
  const { client: r2, bucket } = getR2Client();
  return getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn },
  );
}

export async function createR2DownloadUrl(key: string, expiresIn = 3600) {
  const { client: r2, bucket } = getR2Client();
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn },
  );
}
