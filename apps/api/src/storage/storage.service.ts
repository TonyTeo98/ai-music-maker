import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string | null;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get<string>('S3_BUCKET', 'aimm-assets');
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL', '') || null;

    this.s3Client = new S3Client({
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
      region: this.configService.get<string>('S3_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY', ''),
        secretAccessKey: this.configService.get<string>('S3_SECRET_KEY', ''),
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * 获取公开访问 URL
   * - 生产环境（R2 + 自定义域名）：返回公开 URL
   * - 开发环境（MinIO）：返回签名 URL
   */
  async getPublicUrl(key: string): Promise<string> {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    return this.getPresignedDownloadUrl(key);
  }

  generateKey(trackId: string | null, filename: string): string {
    const ext = filename.split('.').pop() || 'bin';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const prefix = trackId ? `uploads/${trackId}` : 'uploads/pending';
    return `${prefix}/${timestamp}_${randomId}.${ext}`;
  }

  get bucketName(): string {
    return this.bucket;
  }
}
