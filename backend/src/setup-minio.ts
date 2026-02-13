import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  ListBucketsCommand,
} from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "node:https";

// Create HTTPS agent that allows self-signed certs
const agent = new https.Agent({
  rejectUnauthorized: false,
});

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
  requestHandler: new NodeHttpHandler({
    httpsAgent: agent,
  }),
});

const BUCKET = process.env.S3_BUCKET || "uch-connection";

async function setupMinio() {
  console.log("🗄️  MinIO Bucket Setup");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Endpoint: ${process.env.S3_ENDPOINT}`);
  console.log(`Bucket: ${BUCKET}`);
  console.log("");

  // Test connection first
  console.log("🔗 Testing connection...");
  try {
    const buckets = await s3Client.send(new ListBucketsCommand({}));
    console.log(`✅ Connected! Found ${buckets.Buckets?.length || 0} existing buckets.`);
  } catch (error: any) {
    console.error("❌ Connection failed:", error.message);
    console.log("\n💡 Make sure:");
    console.log("   - S3_ENDPOINT is correct");
    console.log("   - S3_ACCESS_KEY and S3_SECRET_KEY are valid");
    console.log("   - MinIO server is running");
    process.exit(1);
  }

  // Check if bucket exists
  console.log(`\n📋 Checking if bucket "${BUCKET}" exists...`);
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET }));
    console.log(`✅ Bucket "${BUCKET}" already exists!`);
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      console.log(`📦 Bucket "${BUCKET}" not found. Creating...`);
      
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET }));
        console.log(`✅ Bucket "${BUCKET}" created successfully!`);
      } catch (createError: any) {
        console.error("❌ Failed to create bucket:", createError.message);
        process.exit(1);
      }
    } else {
      console.error("❌ Error checking bucket:", error.message);
      process.exit(1);
    }
  }

  // Set bucket policy for public read access on artifacts
  console.log("\n🔐 Setting bucket policy for public read access...");
  
  const bucketPolicy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "PublicRead",
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${BUCKET}/artifacts/*`],
      },
    ],
  };

  try {
    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: BUCKET,
        Policy: JSON.stringify(bucketPolicy),
      })
    );
    console.log("✅ Bucket policy set successfully!");
  } catch (policyError: any) {
    console.warn("⚠️  Could not set bucket policy:", policyError.message);
    console.log("   You may need to set this manually in MinIO Console.");
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 MinIO setup complete!");
  console.log(`\n📁 Files will be stored at:`);
  console.log(`   ${process.env.S3_ENDPOINT}/${BUCKET}/artifacts/{org}/{year}/{month}/...`);
  
  process.exit(0);
}

setupMinio().catch((error) => {
  console.error("❌ Setup failed:", error);
  process.exit(1);
});
