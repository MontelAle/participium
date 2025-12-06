import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as Minio from 'minio';
import { MINIO_ERROR_MESSAGES } from './constants/error-messages';
import { MinioProvider } from './minio.provider';

jest.mock('minio');

describe('MinioProvider', () => {
  let provider: MinioProvider;
  let configService: ConfigService;
  let mockMinioClient: jest.Mocked<Minio.Client>;

  beforeEach(async () => {
    mockMinioClient = {
      bucketExists: jest.fn(),
      makeBucket: jest.fn(),
      setBucketPolicy: jest.fn(),
      putObject: jest.fn(),
      removeObject: jest.fn(),
      removeObjects: jest.fn(),
    } as unknown as jest.Mocked<Minio.Client>;

    (Minio.Client as jest.MockedClass<typeof Minio.Client>).mockImplementation(
      () => mockMinioClient,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MinioProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                'minio.bucketName': 'test-bucket',
                'minio.endPoint': 'localhost',
                'minio.port': 9000,

                'minio.publicEndPoint': 'localhost',
                'minio.publicPort': 9000,

                'minio.useSSL': false,
                'minio.accessKey': 'testkey',
                'minio.secretKey': 'testsecret',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<MinioProvider>(MinioProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should create bucket if it does not exist', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(false);
      mockMinioClient.makeBucket.mockResolvedValue(undefined);
      mockMinioClient.setBucketPolicy.mockResolvedValue(undefined);

      await provider.onModuleInit();

      expect(mockMinioClient.bucketExists).toHaveBeenCalledWith('test-bucket');
      expect(mockMinioClient.makeBucket).toHaveBeenCalledWith(
        'test-bucket',
        'us-east-1',
      );
      expect(mockMinioClient.setBucketPolicy).toHaveBeenCalled();
    });

    it('should not create bucket if it already exists', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);

      await provider.onModuleInit();

      expect(mockMinioClient.bucketExists).toHaveBeenCalledWith('test-bucket');
      expect(mockMinioClient.makeBucket).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on initialization error', async () => {
      mockMinioClient.bucketExists.mockRejectedValue(
        new Error('Connection failed'),
      );

      await expect(provider.onModuleInit()).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(provider.onModuleInit()).rejects.toThrow(
        MINIO_ERROR_MESSAGES.BUCKET_INIT_FAILED,
      );
    });

    it('should throw InternalServerErrorException if bucket creation fails', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(false);
      mockMinioClient.makeBucket.mockRejectedValue(
        new Error('Bucket creation failed'),
      );

      await expect(provider.onModuleInit()).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(provider.onModuleInit()).rejects.toThrow(
        MINIO_ERROR_MESSAGES.BUCKET_CREATION_FAILED,
      );
    });

    it('should throw InternalServerErrorException if setting bucket policy fails', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(false);
      mockMinioClient.makeBucket.mockResolvedValue(undefined);
      mockMinioClient.setBucketPolicy.mockRejectedValue(
        new Error('Policy failed'),
      );

      await expect(provider.onModuleInit()).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(provider.onModuleInit()).rejects.toThrow(
        MINIO_ERROR_MESSAGES.BUCKET_POLICY_FAILED,
      );
    });

    it('should handle non-Error exceptions in bucket creation', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(false);
      mockMinioClient.makeBucket.mockRejectedValue('String error');

      await expect(provider.onModuleInit()).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(provider.onModuleInit()).rejects.toThrow(
        MINIO_ERROR_MESSAGES.BUCKET_CREATION_FAILED,
      );
    });

    it('should handle non-Error exceptions in bucket policy', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(false);
      mockMinioClient.makeBucket.mockResolvedValue(undefined);
      mockMinioClient.setBucketPolicy.mockRejectedValue('String error');

      await expect(provider.onModuleInit()).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(provider.onModuleInit()).rejects.toThrow(
        MINIO_ERROR_MESSAGES.BUCKET_POLICY_FAILED,
      );
    });

    it('should handle non-Error exceptions in bucketExists', async () => {
      mockMinioClient.bucketExists.mockRejectedValue('String error');

      await expect(provider.onModuleInit()).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(provider.onModuleInit()).rejects.toThrow(
        MINIO_ERROR_MESSAGES.BUCKET_INIT_FAILED,
      );
    });
  });

  describe('uploadFile', () => {
    it('should upload a file and return the URL', async () => {
      const fileName = 'test.jpg';
      const buffer = Buffer.from('test');
      const mimetype = 'image/jpeg';

      mockMinioClient.putObject.mockResolvedValue({
        etag: 'test-etag',
        versionId: 'test-version',
      });

      const result = await provider.uploadFile(fileName, buffer, mimetype);

      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        'test-bucket',
        fileName,
        buffer,
        buffer.length,
        { 'Content-Type': mimetype },
      );
      expect(result).toBe('http://localhost:9000/test-bucket/test.jpg');
    });

    it('should throw InternalServerErrorException if upload fails', async () => {
      mockMinioClient.putObject.mockRejectedValue(new Error('Upload failed'));

      await expect(
        provider.uploadFile('test.jpg', Buffer.from('test'), 'image/jpeg'),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        provider.uploadFile('test.jpg', Buffer.from('test'), 'image/jpeg'),
      ).rejects.toThrow(MINIO_ERROR_MESSAGES.FILE_UPLOAD_FAILED);
    });

    it('should handle non-Error exceptions in upload', async () => {
      mockMinioClient.putObject.mockRejectedValue('String error');

      await expect(
        provider.uploadFile('test.jpg', Buffer.from('test'), 'image/jpeg'),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        provider.uploadFile('test.jpg', Buffer.from('test'), 'image/jpeg'),
      ).rejects.toThrow(MINIO_ERROR_MESSAGES.FILE_UPLOAD_FAILED);
    });

    it('should construct URL with HTTPS protocol when useSSL is true', async () => {
      const mockConfigWithSSL = {
        get: jest.fn((key: string, defaultValue?: unknown) => {
          const config: Record<string, unknown> = {
            'minio.bucketName': 'test-bucket',
            'minio.endPoint': 'minio.example.com',
            'minio.port': 443,
            'minio.useSSL': true,
            'minio.accessKey': 'testkey',
            'minio.secretKey': 'testsecret',
          };
          return config[key] ?? defaultValue;
        }),
      };

      const moduleWithSSL = await Test.createTestingModule({
        providers: [
          MinioProvider,
          {
            provide: ConfigService,
            useValue: mockConfigWithSSL,
          },
        ],
      }).compile();

      const providerWithSSL = moduleWithSSL.get<MinioProvider>(MinioProvider);
      mockMinioClient.putObject.mockResolvedValue({
        etag: 'test-etag',
        versionId: 'test-version',
      });

      const result = await providerWithSSL.uploadFile(
        'test.jpg',
        Buffer.from('test'),
        'image/jpeg',
      );

      expect(result).toBe('https://minio.example.com/test-bucket/test.jpg');
    });

    it('should construct URL without port for standard ports (80)', async () => {
      const mockConfigPort80 = {
        get: jest.fn((key: string, defaultValue?: unknown) => {
          const config: Record<string, unknown> = {
            'minio.bucketName': 'test-bucket',
            'minio.endPoint': 'minio.example.com',
            'minio.port': 80,
            'minio.useSSL': false,
            'minio.accessKey': 'testkey',
            'minio.secretKey': 'testsecret',
          };
          return config[key] ?? defaultValue;
        }),
      };

      const modulePort80 = await Test.createTestingModule({
        providers: [
          MinioProvider,
          {
            provide: ConfigService,
            useValue: mockConfigPort80,
          },
        ],
      }).compile();

      const providerPort80 = modulePort80.get<MinioProvider>(MinioProvider);
      mockMinioClient.putObject.mockResolvedValue({
        etag: 'test-etag',
        versionId: 'test-version',
      });

      const result = await providerPort80.uploadFile(
        'test.jpg',
        Buffer.from('test'),
        'image/jpeg',
      );

      expect(result).toBe('http://minio.example.com/test-bucket/test.jpg');
    });
    it('should use public configuration for URL generation if different from internal', async () => {
      const mockConfigSplit = {
        get: jest.fn((key: string, defaultValue?: unknown) => {
          const config: Record<string, unknown> = {
            'minio.bucketName': 'test-bucket',
            'minio.endPoint': 'minio-internal',
            'minio.port': 9000,
            'minio.publicEndPoint': 'my-website.com',
            'minio.publicPort': 80,
            'minio.useSSL': false,
          };
          return config[key] ?? defaultValue;
        }),
      };

      const moduleSplit = await Test.createTestingModule({
        providers: [
          MinioProvider,
          { provide: ConfigService, useValue: mockConfigSplit },
        ],
      }).compile();

      const providerSplit = moduleSplit.get<MinioProvider>(MinioProvider);

      mockMinioClient.putObject.mockResolvedValue({
        etag: 'etag',
        versionId: 'v1',
      });

      const result = await providerSplit.uploadFile(
        'test.jpg',
        Buffer.from('data'),
        'image/jpeg',
      );

      expect(result).toBe('http://my-website.com/test-bucket/test.jpg');
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      const fileName = 'test.jpg';
      mockMinioClient.removeObject.mockResolvedValue(undefined);

      await provider.deleteFile(fileName);

      expect(mockMinioClient.removeObject).toHaveBeenCalledWith(
        'test-bucket',
        fileName,
      );
    });

    it('should throw InternalServerErrorException if deletion fails', async () => {
      mockMinioClient.removeObject.mockRejectedValue(
        new Error('Deletion failed'),
      );

      await expect(provider.deleteFile('test.jpg')).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(provider.deleteFile('test.jpg')).rejects.toThrow(
        MINIO_ERROR_MESSAGES.FILE_DELETE_FAILED,
      );
    });

    it('should handle non-Error exceptions in deleteFile', async () => {
      mockMinioClient.removeObject.mockRejectedValue('String error');

      await expect(provider.deleteFile('test.jpg')).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(provider.deleteFile('test.jpg')).rejects.toThrow(
        MINIO_ERROR_MESSAGES.FILE_DELETE_FAILED,
      );
    });
  });

  describe('deleteFiles', () => {
    it('should delete multiple files', async () => {
      const fileNames = ['test1.jpg', 'test2.jpg'];
      mockMinioClient.removeObjects.mockResolvedValue(undefined);

      await provider.deleteFiles(fileNames);

      expect(mockMinioClient.removeObjects).toHaveBeenCalledWith(
        'test-bucket',
        fileNames,
      );
    });

    it('should throw InternalServerErrorException if deleteFiles fails', async () => {
      mockMinioClient.removeObjects.mockRejectedValue(
        new Error('Bulk deletion failed'),
      );

      await expect(
        provider.deleteFiles(['test1.jpg', 'test2.jpg']),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        provider.deleteFiles(['test1.jpg', 'test2.jpg']),
      ).rejects.toThrow(MINIO_ERROR_MESSAGES.FILES_DELETE_FAILED);
    });

    it('should handle non-Error exceptions in deleteFiles', async () => {
      mockMinioClient.removeObjects.mockRejectedValue('String error');

      await expect(
        provider.deleteFiles(['test1.jpg', 'test2.jpg']),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        provider.deleteFiles(['test1.jpg', 'test2.jpg']),
      ).rejects.toThrow(MINIO_ERROR_MESSAGES.FILES_DELETE_FAILED);
    });
  });

  describe('extractFileNameFromUrl', () => {
    it('should extract full path from URL after bucket name', () => {
      const url = 'http://localhost:9000/test-bucket/reports/123/image.jpg';
      const result = provider.extractFileNameFromUrl(url);
      expect(result).toBe('reports/123/image.jpg');
    });

    it('should throw error for invalid URL format', () => {
      const invalidUrl = 'http://localhost:9000/invalid-url-without-bucket';
      expect(() => provider.extractFileNameFromUrl(invalidUrl)).toThrow(
        'Invalid MinIO URL format',
      );
    });
  });

  describe('getClient', () => {
    it('should return the MinIO client', () => {
      const client = provider.getClient();
      expect(client).toBeDefined();
    });
  });

  describe('getBucketName', () => {
    it('should return the bucket name', () => {
      const bucketName = provider.getBucketName();
      expect(bucketName).toBe('test-bucket');
    });
  });
});
