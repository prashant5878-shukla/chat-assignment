import express from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { authMiddleware } from "../middleware/auth.js";
import crypto from "crypto";

const router = express.Router();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

console.log("AWS Config Check:", {
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ? "✅ Set" : "❌ MISSING",
  secretKey: process.env.AWS_SECRET_ACCESS_KEY ? "✅ Set" : "❌ MISSING",
  bucket: process.env.AWS_BUCKET_NAME,
});

router.get("/presigned-url", authMiddleware, async (req, res) => {
  try {
    const { filename, filetype } = req.query;
    if (!filename || !filetype) {
      return res
        .status(400)
        .json({ error: "filename and filetype are required" });
    }

    const ext = filename.split(".").pop();
    const uniqueFilename = `${crypto.randomUUID()}.${ext}`;
    const key = `uploads/${uniqueFilename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME || "chat-app",
      Key: key,
      ContentType: filetype,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    res.json({ presignedUrl: url, fileUrl, key });
  } catch (err) {
    console.error("Error generating presigned URL:", err);
    res.status(500).json({ error: "Failed to generate S3 presigned URL" });
  }
});

export default router;
