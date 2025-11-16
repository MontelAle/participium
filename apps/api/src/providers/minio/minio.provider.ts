import {
  Injectable,
  OnModuleInit,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { MINIO_ERROR_MESSAGES } from './constants/error-messages';

@Injectable()
export class MinioProvider implements OnModuleInit {
  private readonly logger = new Logger(MinioProvider.name);
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>(
      'minio.bucketName',
      'participium-reports',
    );

    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('minio.endPoint', 'localhost'),
      port: this.configService.get<number>('minio.port', 9000),
      useSSL: this.configService.get<boolean>('minio.useSSL', false),
      accessKey: this.configService.get<string>('minio.accessKey', 'minioadmin'),
      secretKey: this.configService.get<string>('minio.secretKey', 'minioadmin'),
    });
  }

  async onModuleInit() {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        try {
          await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
          this.logger.log(`Bucket "${this.bucketName}" created successfully`);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`${MINIO_ERROR_MESSAGES.BUCKET_CREATION_FAILED}: ${message}`);
          throw new InternalServerErrorException(
            MINIO_ERROR_MESSAGES.BUCKET_CREATION_FAILED,
          );
        }

        // Imposta la policy per rendere le immagini pubbliche (read-only)
        try {
          const policy = {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${this.bucketName}/*`],
              },
            ],
          };
          await this.minioClient.setBucketPolicy(
            this.bucketName,
            JSON.stringify(policy),
          );
          this.logger.log(`Bucket policy set for "${this.bucketName}"`);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`${MINIO_ERROR_MESSAGES.BUCKET_POLICY_FAILED}: ${message}`);
          throw new InternalServerErrorException(
            MINIO_ERROR_MESSAGES.BUCKET_POLICY_FAILED,
          );
        }
      } else {
        this.logger.log(`Bucket "${this.bucketName}" already exists`);
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`${MINIO_ERROR_MESSAGES.BUCKET_INIT_FAILED}: ${message}`);
      throw new InternalServerErrorException(
        MINIO_ERROR_MESSAGES.BUCKET_INIT_FAILED,
      );
    }
  }

  getClient(): Minio.Client {
    return this.minioClient;
  }

  getBucketName(): string {
    return this.bucketName;
  }

  /**
   * Upload a file to MinIO
   * @param fileName - The name to give the file in MinIO
   * @param buffer - The file buffer
   * @param mimetype - The MIME type of the file
   * @returns The file URL
   */
  async uploadFile(
    fileName: string,
    buffer: Buffer,
    mimetype: string,
  ): Promise<string> {
    try {
      await this.minioClient.putObject(
        this.bucketName,
        fileName,
        buffer,
        buffer.length,
        {
          'Content-Type': mimetype,
        },
      );

      // Costruisci l'URL pubblico del file
      const endPoint = this.configService.get<string>('minio.endPoint');
      const port = this.configService.get<number>('minio.port');
      const useSSL = this.configService.get<boolean>('minio.useSSL');
      const protocol = useSSL ? 'https' : 'http';
      const portString = port === 80 || port === 443 ? '' : `:${port}`;

      return `${protocol}://${endPoint}${portString}/${this.bucketName}/${fileName}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`${MINIO_ERROR_MESSAGES.FILE_UPLOAD_FAILED}: ${message}`);
      throw new InternalServerErrorException(
        MINIO_ERROR_MESSAGES.FILE_UPLOAD_FAILED,
      );
    }
  }

  /**
   * Delete a file from MinIO
   * @param fileName - The name of the file to delete
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, fileName);
      this.logger.log(`File "${fileName}" deleted successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`${MINIO_ERROR_MESSAGES.FILE_DELETE_FAILED}: ${message}`);
      throw new InternalServerErrorException(
        MINIO_ERROR_MESSAGES.FILE_DELETE_FAILED,
      );
    }
  }

  /**
   * Delete multiple files from MinIO
   * @param fileNames - Array of file names to delete
   */
  async deleteFiles(fileNames: string[]): Promise<void> {
    try {
      await this.minioClient.removeObjects(this.bucketName, fileNames);
      this.logger.log(`${fileNames.length} files deleted successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`${MINIO_ERROR_MESSAGES.FILES_DELETE_FAILED}: ${message}`);
      throw new InternalServerErrorException(
        MINIO_ERROR_MESSAGES.FILES_DELETE_FAILED,
      );
    }
  }

  /**
   * Extract the file name from a MinIO URL
   * @param url - The full MinIO URL
   * @returns The file name
   */
  extractFileNameFromUrl(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1];
  }
}
