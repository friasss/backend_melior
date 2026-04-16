import { cloudinary } from "../config/cloudinary";
import streamifier from "streamifier";

interface UploadResult {
  url: string;
  publicId: string;
}

export class UploadService {
  /**
   * Upload a single buffer to Cloudinary.
   */
  async uploadBuffer(
    buffer: Buffer,
    folder: string = "melior/properties"
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          transformation: [
            { width: 1600, height: 1200, crop: "limit", quality: "auto:good", fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error || !result) return reject(error || new Error("Upload failed"));
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );
      streamifier.createReadStream(buffer).pipe(stream);
    });
  }

  /**
   * Upload multiple buffers concurrently.
   */
  async uploadMany(
    files: Express.Multer.File[],
    folder: string = "melior/properties"
  ): Promise<UploadResult[]> {
    return Promise.all(files.map((f) => this.uploadBuffer(f.buffer, folder)));
  }

  /**
   * Delete an image from Cloudinary by public_id.
   */
  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  /**
   * Delete multiple images.
   */
  async deleteMany(publicIds: string[]): Promise<void> {
    if (publicIds.length === 0) return;
    await Promise.all(publicIds.map((id) => this.deleteImage(id)));
  }
}

export const uploadService = new UploadService();
