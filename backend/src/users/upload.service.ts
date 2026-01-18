import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      api_key: process.env.CLOUDINARY_KEY,
      api_secret: process.env.CLOUDINARY_SECRET,
      cloud_name: process.env.CLOUDINARY_NAME
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: 'image',
              public_id: `profile-pictures/${Date.now()}-${file.originalname.split('.')[0]}`,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(file.buffer);
      });

      return result.secure_url;
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
}
