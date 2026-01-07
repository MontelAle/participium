import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from '../categories/categories.service';
import { ReportsService } from '../reports/reports.service';
import { createMockCategories } from './__test-utils__/telegram-mocks';
import { TelegramAuthService } from './telegram-auth.service';
import { TelegramImageService } from './telegram-image.service';
import { TelegramService } from './telegram.service';

describe('TelegramService', () => {
  let service: TelegramService;
  let reportsService: jest.Mocked<ReportsService>;
  let categoriesService: jest.Mocked<CategoriesService>;
  let telegramImageService: jest.Mocked<TelegramImageService>;
  let telegramAuthService: jest.Mocked<TelegramAuthService>;

  beforeEach(async () => {
    const mockReportsService = {
      create: jest.fn(),
    };

    const mockCategoriesService = {
      findAll: jest.fn(),
    };

    const mockTelegramImageService = {
      downloadImages: jest.fn(),
    };

    const mockTelegramAuthService = {
      getUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        { provide: ReportsService, useValue: mockReportsService },
        { provide: CategoriesService, useValue: mockCategoriesService },
        { provide: TelegramImageService, useValue: mockTelegramImageService },
        { provide: TelegramAuthService, useValue: mockTelegramAuthService },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
    reportsService = module.get(ReportsService);
    categoriesService = module.get(CategoriesService);
    telegramImageService = module.get(TelegramImageService);
    telegramAuthService = module.get(TelegramAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReport', () => {
    const telegramId = '123456789';
    const userId = 'user-123';
    const reportData = {
      title: 'Test Report',
      description: 'This is a test report description',
      latitude: 45.070312,
      longitude: 7.686864,
      address: 'Via Roma 1, Torino',
      categoryId: 'cat-123',
      isAnonymous: false,
    };
    const photoFileIds = ['file_id_1', 'file_id_2'];

    it('should create report successfully', async () => {
      const mockImages: Express.Multer.File[] = [
        {
          fieldname: 'images',
          originalname: 'photo1.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from([]),
          size: 1024,
        } as Express.Multer.File,
        {
          fieldname: 'images',
          originalname: 'photo2.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from([]),
          size: 2048,
        } as Express.Multer.File,
      ];

      const mockReport = {
        id: 'report-123',
        title: reportData.title,
        description: reportData.description,
        latitude: reportData.latitude,
        longitude: reportData.longitude,
        address: reportData.address,
        categoryId: reportData.categoryId,
        isAnonymous: reportData.isAnonymous,
        userId,
        status: 'pending',
      };

      telegramAuthService.getUserId.mockResolvedValue(userId);
      telegramImageService.downloadImages.mockResolvedValue(mockImages);
      reportsService.create.mockResolvedValue(mockReport as any);

      const result = await service.createReport(
        telegramId,
        reportData,
        photoFileIds,
      );

      expect(result).toEqual(mockReport);
      expect(telegramAuthService.getUserId).toHaveBeenCalledWith(telegramId);
      expect(telegramImageService.downloadImages).toHaveBeenCalledWith(
        photoFileIds,
      );
      expect(reportsService.create).toHaveBeenCalledWith(
        {
          title: reportData.title,
          description: reportData.description,
          latitude: reportData.latitude,
          longitude: reportData.longitude,
          address: reportData.address,
          categoryId: reportData.categoryId,
          isAnonymous: reportData.isAnonymous,
        },
        userId,
        mockImages,
      );
    });

    it('should throw error if user not linked', async () => {
      telegramAuthService.getUserId.mockResolvedValue(null);

      await expect(
        service.createReport(telegramId, reportData, photoFileIds),
      ).rejects.toThrow('User not linked');

      expect(telegramImageService.downloadImages).not.toHaveBeenCalled();
      expect(reportsService.create).not.toHaveBeenCalled();
    });

    it('should pass all report data fields correctly', async () => {
      telegramAuthService.getUserId.mockResolvedValue(userId);
      telegramImageService.downloadImages.mockResolvedValue([]);
      reportsService.create.mockResolvedValue({
        id: 'report-123',
      } as any);

      await service.createReport(telegramId, reportData, photoFileIds);

      expect(reportsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: reportData.title,
          description: reportData.description,
          latitude: reportData.latitude,
          longitude: reportData.longitude,
          address: reportData.address,
          categoryId: reportData.categoryId,
          isAnonymous: reportData.isAnonymous,
        }),
        userId,
        expect.any(Array),
      );
    });

    it('should handle optional address field', async () => {
      const reportDataWithoutAddress: typeof reportData = {
        ...reportData,
        address: undefined
      };
      telegramAuthService.getUserId.mockResolvedValue(userId);
      telegramImageService.downloadImages.mockResolvedValue([]);
      reportsService.create.mockResolvedValue({
        id: 'report-123',
      } as any);

      await service.createReport(
        telegramId,
        reportDataWithoutAddress,
        photoFileIds,
      );

      expect(reportsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          address: undefined,
        }),
        userId,
        expect.any(Array),
      );
    });

    it('should handle anonymous reports', async () => {
      const anonymousReportData = { ...reportData, isAnonymous: true };
      telegramAuthService.getUserId.mockResolvedValue(userId);
      telegramImageService.downloadImages.mockResolvedValue([]);
      reportsService.create.mockResolvedValue({
        id: 'report-123',
      } as any);

      await service.createReport(
        telegramId,
        anonymousReportData,
        photoFileIds,
      );

      expect(reportsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isAnonymous: true,
        }),
        userId,
        expect.any(Array),
      );
    });

    it('should download images via TelegramImageService', async () => {
      telegramAuthService.getUserId.mockResolvedValue(userId);
      telegramImageService.downloadImages.mockResolvedValue([]);
      reportsService.create.mockResolvedValue({
        id: 'report-123',
      } as any);

      await service.createReport(telegramId, reportData, photoFileIds);

      expect(telegramImageService.downloadImages).toHaveBeenCalledWith(
        photoFileIds,
      );
    });
  });

  describe('getCategories', () => {
    it('should return categories from CategoriesService', async () => {
      const mockCategories = createMockCategories();
      categoriesService.findAll.mockResolvedValue(mockCategories as any);

      const result = await service.getCategories();

      expect(result).toEqual(mockCategories);
      expect(categoriesService.findAll).toHaveBeenCalled();
    });

    it('should return empty array if no categories', async () => {
      categoriesService.findAll.mockResolvedValue([]);

      const result = await service.getCategories();

      expect(result).toEqual([]);
    });
  });
});
