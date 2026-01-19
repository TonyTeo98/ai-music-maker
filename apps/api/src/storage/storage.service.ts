import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import axios from 'axios';

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
      forcePathStyle: true, // Required for R2 path-style access
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

  /**
   * 从 URL 下载文件并上传到 R2
   * @param sourceUrl 源 URL（Suno CDN）
   * @param key R2 存储 key
   * @param options 可选配置
   * @returns 上传结果
   */
  async uploadFromUrl(
    sourceUrl: string,
    key: string,
    options?: { contentType?: string; timeout?: number }
  ): Promise<{ key: string; size: number }> {
    const timeout = options?.timeout || 120000; // 2分钟默认超时

    try {
      // 下载文件
      const response = await axios.get(sourceUrl, {
        responseType: 'arraybuffer',
        timeout,
        maxContentLength: 50 * 1024 * 1024, // 50MB 限制
      });

      const buffer = Buffer.from(response.data);
      const contentType = options?.contentType || response.headers['content-type'] || 'audio/mpeg';

      // 上传到 R2
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      return { key, size: buffer.length };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error(`DOWNLOAD_TIMEOUT: ${sourceUrl}`);
        }
        throw new Error(`DOWNLOAD_FAILED: ${error.message}`);
      }
      throw new Error(`UPLOAD_FAILED: ${error.message}`);
    }
  }

  /**
   * 删除 R2 对象
   * @param key R2 存储 key
   */
  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
    } catch (error: any) {
      // 404 不算错误（幂等性）
      if (error.name !== 'NoSuchKey') {
        throw error;
      }
    }
  }

  /**
   * 批量删除 R2 对象
   * @param keys R2 存储 key 列表
   * @returns 删除结果
   */
  async deleteObjects(keys: string[]): Promise<{ deleted: string[]; errors: string[] }> {
    const deleted: string[] = [];
    const errors: string[] = [];

    for (const key of keys) {
      try {
        await this.deleteObject(key);
        deleted.push(key);
      } catch (error) {
        errors.push(key);
        console.error(`Failed to delete ${key}:`, error);
      }
    }

    return { deleted, errors };
  }
}
