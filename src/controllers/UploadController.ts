import { Response } from "express";
import { AuthenticatedRequest } from "../middleware";
import { uploadS3, getPublicUrl } from "../utils/s3Upload";

export class UploadController {
  // Upload single image
  async uploadImage(req: AuthenticatedRequest, res: Response) {
    try {
      // Use multer middleware to handle single file upload
      uploadS3.single("image")(req, res, (err: any) => {
        if (err) {
          console.error("Upload error:", err);
          return res.status(400).json({
            success: false,
            message: err.message || "Lỗi khi upload ảnh",
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: "Không có file được upload",
          });
        }

        // Get the uploaded file info
        const file = req.file as any; // multer-s3 adds extra properties
        const publicUrl = file.location || getPublicUrl(file.key);

        res.json({
          success: true,
          message: "Upload ảnh thành công",
          data: {
            url: publicUrl,
            filename: file.key,
            originalName: file.originalname,
            size: file.size,
          },
        });
      });
    } catch (error) {
      console.error("Error in uploadImage:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi upload ảnh",
      });
    }
  }

  // Upload multiple images
  async uploadImages(req: AuthenticatedRequest, res: Response) {
    try {
      // Use multer middleware to handle multiple file upload
      uploadS3.array("images", 10)(req, res, (err: any) => {
        if (err) {
          console.error("Upload error:", err);
          return res.status(400).json({
            success: false,
            message: err.message || "Lỗi khi upload ảnh",
          });
        }

        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Không có file được upload",
          });
        }

        // Process uploaded files
        const uploadedFiles = req.files.map((file: any) => {
          const publicUrl = file.location || getPublicUrl(file.key);
          return {
            url: publicUrl,
            filename: file.key,
            originalName: file.originalname,
            size: file.size,
          };
        });

        res.json({
          success: true,
          message: `Upload ${uploadedFiles.length} ảnh thành công`,
          data: uploadedFiles,
        });
      });
    } catch (error) {
      console.error("Error in uploadImages:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi upload ảnh",
      });
    }
  }

  // Delete image
  async deleteImage(req: AuthenticatedRequest, res: Response) {
    try {
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          message: "URL ảnh là bắt buộc",
        });
      }

      // Import deleteFile function here to avoid circular dependency
      const { deleteFile } = require("../utils/s3Upload");
      const deleted = await deleteFile(imageUrl);

      if (deleted) {
        res.json({
          success: true,
          message: "Xóa ảnh thành công",
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Không thể xóa ảnh",
        });
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi xóa ảnh",
      });
    }
  }
}
