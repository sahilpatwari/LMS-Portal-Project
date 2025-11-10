import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize the S3 client once and export it
const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

/**
 * Generates a pre-signed URL for uploading a file.
 * @param {string} key - The full S3 key (path) for the new file.
 * @param {string} contentType - The MIME type of the file.
 * @returns {Promise<string>} - The pre-signed PUT URL.
 */
export async function getPresignedUploadUrl(key, contentType) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 min expiry
}

/**
 * Generates a pre-signed URL for downloading a file.
 * @param {string} key - The S3 key of the file to download.
 * @returns {Promise<string>} - The pre-signed GET URL.
 */
export async function getPresignedDownloadUrl(key) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiry
}