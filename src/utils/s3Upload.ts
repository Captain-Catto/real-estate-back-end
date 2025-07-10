import AWS from "aws-sdk";
import multerS3 from "multer-s3";
import multer from "multer";
import { Request } from "express";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

// Kiểm tra biến môi trường
if (
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_REGION ||
  !process.env.S3_BUCKET
) {
  console.error("AWS S3 environment variables are missing!");
}

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
});

export const uploadS3 = multer({
  storage: multerS3({
    s3: s3 as any,
    bucket: process.env.S3_BUCKET!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const uniqueId = uuidv4().slice(0, 8);
      const cleanFileName = file.originalname
        .replace(/[^a-zA-Z0-9.]/g, "_")
        .toLowerCase();

      // Determine folder based on request URL
      let folder = "uploads";
      const expressReq = req as Request;
      if (expressReq.url?.includes("/projects")) {
        folder = "projects";
      } else if (expressReq.url?.includes("/posts")) {
        folder = "posts";
      }

      const fileName = `${folder}/${uniqueId}-${cleanFileName}`;
      cb(null, fileName);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/gif",
      "image/webp",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh (jpg, png, gif, webp)"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 20,
  },
});

// Tạo URL công khai cho file
export const getPublicUrl = (filename: string): string => {
  return `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
};

// Xóa file từ S3
export const deleteFile = async (fileUrl: string): Promise<boolean> => {
  try {
    // Trích xuất key từ URL
    const url = new URL(fileUrl);
    const key = url.pathname.slice(1); // Bỏ dấu '/'

    await s3
      .deleteObject({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
      })
      .promise();
    return true;
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    return false;
  }
};
