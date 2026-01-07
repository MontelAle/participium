import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { getBotToken } from 'nestjs-telegraf';
import { createMockTelegrafBot } from './__test-utils__/telegram-mocks';
import { TelegramImageService } from './telegram-image.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TelegramImageService', () => {
  let service: TelegramImageService;
  let mockBot: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockBot = createMockTelegrafBot();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramImageService,
        {
          provide: getBotToken(),
          useValue: mockBot,
        },
      ],
    }).compile();

    service = module.get<TelegramImageService>(TelegramImageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('downloadImages', () => {
    it('should download a single image', async () => {
      const fileId = 'file_id_1';
      mockBot.telegram.getFileLink.mockResolvedValue({
        href: 'https://api.telegram.org/file/bot<token>/photos/file_1.jpg',
      });

      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      mockedAxios.get.mockResolvedValue({
        data: jpegBuffer,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });

      const result = await service.downloadImages([fileId]);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        fieldname: 'images',
        originalname: 'file_1.jpg',
        mimetype: 'image/jpeg',
        size: 4,
      });
      expect(result[0].buffer).toBeInstanceOf(Buffer);
    });

    it('should download multiple images sequentially', async () => {
      const fileIds = ['file_1', 'file_2', 'file_3'];
      mockBot.telegram.getFileLink
        .mockResolvedValueOnce({
          href: 'https://api.telegram.org/file/bot<token>/file_1.jpg',
        })
        .mockResolvedValueOnce({
          href: 'https://api.telegram.org/file/bot<token>/file_2.png',
        })
        .mockResolvedValueOnce({
          href: 'https://api.telegram.org/file/bot<token>/file_3.gif',
        });

      const jpegBuffer = Buffer.from([0xff, 0xd8, 0x00, 0x00]);
      const pngBuffer = Buffer.from([0x89, 0x50, 0x00, 0x00]);
      const gifBuffer = Buffer.from([0x47, 0x49, 0x00, 0x00]);

      mockedAxios.get
        .mockResolvedValueOnce({ data: jpegBuffer })
        .mockResolvedValueOnce({ data: pngBuffer })
        .mockResolvedValueOnce({ data: gifBuffer });

      const result = await service.downloadImages(fileIds);

      expect(result).toHaveLength(3);
      expect(result[0].mimetype).toBe('image/jpeg');
      expect(result[1].mimetype).toBe('image/png');
      expect(result[2].mimetype).toBe('image/gif');
    });

    it('should handle empty array', async () => {
      const result = await service.downloadImages([]);

      expect(result).toEqual([]);
      expect(mockBot.telegram.getFileLink).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on getFileLink failure', async () => {
      mockBot.telegram.getFileLink.mockRejectedValue(
        new Error('Telegram API error'),
      );

      await expect(service.downloadImages(['file_1'])).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.downloadImages(['file_1'])).rejects.toThrow(
        'Failed to download image: Telegram API error',
      );
    });

    it('should throw InternalServerErrorException on axios download failure', async () => {
      mockBot.telegram.getFileLink.mockResolvedValue({
        href: 'https://api.telegram.org/file/bot<token>/file_1.jpg',
      });
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(service.downloadImages(['file_1'])).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.downloadImages(['file_1'])).rejects.toThrow(
        'Failed to download image: Network error',
      );
    });

    it('should call axios with correct parameters', async () => {
      const fileUrl = 'https://api.telegram.org/file/bot<token>/file_1.jpg';
      mockBot.telegram.getFileLink.mockResolvedValue({ href: fileUrl });
      mockedAxios.get.mockResolvedValue({
        data: Buffer.from([0xff, 0xd8, 0x00, 0x00]),
      });

      await service.downloadImages(['file_1']);

      expect(mockedAxios.get).toHaveBeenCalledWith(fileUrl, {
        responseType: 'arraybuffer',
      });
    });
  });

  describe('detectMimetype', () => {
    it('should detect JPEG mimetype (0xFF 0xD8)', async () => {
      mockBot.telegram.getFileLink.mockResolvedValue({
        href: 'https://api.telegram.org/file/bot<token>/file.jpg',
      });
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      mockedAxios.get.mockResolvedValue({ data: jpegBuffer });

      const result = await service.downloadImages(['file_1']);

      expect(result[0].mimetype).toBe('image/jpeg');
    });

    it('should detect PNG mimetype (0x89 0x50)', async () => {
      mockBot.telegram.getFileLink.mockResolvedValue({
        href: 'https://api.telegram.org/file/bot<token>/file.png',
      });
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      mockedAxios.get.mockResolvedValue({ data: pngBuffer });

      const result = await service.downloadImages(['file_1']);

      expect(result[0].mimetype).toBe('image/png');
    });

    it('should detect GIF mimetype (0x47 0x49)', async () => {
      mockBot.telegram.getFileLink.mockResolvedValue({
        href: 'https://api.telegram.org/file/bot<token>/file.gif',
      });
      const gifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38]);
      mockedAxios.get.mockResolvedValue({ data: gifBuffer });

      const result = await service.downloadImages(['file_1']);

      expect(result[0].mimetype).toBe('image/gif');
    });

    it('should default to JPEG for unknown file types', async () => {
      mockBot.telegram.getFileLink.mockResolvedValue({
        href: 'https://api.telegram.org/file/bot<token>/file.unknown',
      });
      const unknownBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      mockedAxios.get.mockResolvedValue({ data: unknownBuffer });

      const result = await service.downloadImages(['file_1']);

      expect(result[0].mimetype).toBe('image/jpeg');
    });
  });

  describe('extractFilename', () => {
    it('should extract filename from URL', async () => {
      mockBot.telegram.getFileLink.mockResolvedValue({
        href: 'https://api.telegram.org/file/bot<token>/photos/photo_123.jpg',
      });
      mockedAxios.get.mockResolvedValue({
        data: Buffer.from([0xff, 0xd8, 0x00, 0x00]),
      });

      const result = await service.downloadImages(['file_1']);

      expect(result[0].originalname).toBe('photo_123.jpg');
      expect(result[0].filename).toBe('photo_123.jpg');
    });

    it('should use default filename when extraction fails', async () => {
      mockBot.telegram.getFileLink.mockResolvedValue({
        href: 'https://api.telegram.org/file/bot<token>/',
      });
      mockedAxios.get.mockResolvedValue({
        data: Buffer.from([0xff, 0xd8, 0x00, 0x00]),
      });

      const result = await service.downloadImages(['file_1']);

      expect(result[0].originalname).toBe('telegram-image.jpg');
      expect(result[0].filename).toBe('telegram-image.jpg');
    });

    it('should handle URL with query parameters', async () => {
      mockBot.telegram.getFileLink.mockResolvedValue({
        href: 'https://api.telegram.org/file/bot<token>/photos/photo.jpg?token=xyz',
      });
      mockedAxios.get.mockResolvedValue({
        data: Buffer.from([0xff, 0xd8, 0x00, 0x00]),
      });

      const result = await service.downloadImages(['file_1']);

      expect(result[0].originalname).toBe('photo.jpg?token=xyz');
    });
  });

  describe('Multer file structure', () => {
    it('should create valid Multer file structure', async () => {
      mockBot.telegram.getFileLink.mockResolvedValue({
        href: 'https://api.telegram.org/file/bot<token>/file.jpg',
      });
      const buffer = Buffer.from([0xff, 0xd8, 0xaa, 0xbb]);
      mockedAxios.get.mockResolvedValue({ data: buffer });

      const result = await service.downloadImages(['file_1']);

      expect(result[0]).toMatchObject({
        fieldname: 'images',
        originalname: 'file.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 4,
        stream: null,
        destination: null,
        filename: 'file.jpg',
        path: null,
      });
      expect(result[0].buffer).toEqual(buffer);
    });
  });
});
