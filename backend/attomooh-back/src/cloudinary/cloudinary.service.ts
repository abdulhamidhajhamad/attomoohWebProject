import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
}

export interface UploadedImageFile {
  buffer: Buffer;
  size?: number;
  mimetype?: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY_MS = 1000;

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculateDelay(attempt: number): number {
    return this.BASE_DELAY_MS * Math.pow(2, attempt);
  }

  async uploadImage(
    file: UploadedImageFile,
    folder: string,
  ): Promise<CloudinaryUploadResult> {
    const fileSize = file.size ?? file.buffer.length;
    if (fileSize > this.MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await this.uploadOnce(file, folder);
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.MAX_RETRIES) {
          const delay = this.calculateDelay(attempt);
          this.logger.warn(
            `Cloudinary upload failed (attempt ${attempt + 1}/${this.MAX_RETRIES + 1}), retrying in ${delay}ms: ${lastError.message}`,
          );
          await this.sleep(delay);
        }
      }
    }

    this.logger.error('Cloudinary upload failed after all retries', lastError);
    throw new BadRequestException('Image upload failed after retries');
  }

  private uploadOnce(
    file: UploadedImageFile,
    folder: string,
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          },
          (
            error: UploadApiErrorResponse | undefined,
            result: UploadApiResponse | undefined,
          ) => {
            if (error || !result) {
              reject(new BadRequestException(error?.message ?? 'Image upload failed'));
              return;
            }

            resolve({
              publicId: result.public_id,
              url: result.url,
              secureUrl: result.secure_url,
              format: result.format,
              width: result.width,
              height: result.height,
            });
          },
        )
        .end(file.buffer);
    });
  }

  async uploadMultipleImages(
    files: UploadedImageFile[],
    folder: string,
  ): Promise<CloudinaryUploadResult[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Deleted image: ${publicId}`);
    } catch (error) {
      this.logger.error(`Failed to delete image: ${publicId}`, error);
    }
  }

  async deleteMultipleImages(publicIds: string[]): Promise<void> {
    const deletePromises = publicIds.map((id) => this.deleteImage(id));
    await Promise.all(deletePromises);
  }
}
