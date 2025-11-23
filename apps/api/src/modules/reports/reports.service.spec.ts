import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Report, ReportStatus } from '../../common/entities/report.entity';
import { Category } from '../../common/entities/category.entity';
import { User } from '../../common/entities/user.entity';
import {
  CreateReportDto,
  UpdateReportDto,
  FilterReportsDto,
} from '../../common/dto/report.dto';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MinioProvider } from '../../providers/minio/minio.provider';
import { REPORT_ERROR_MESSAGES } from './constants/error-messages';

jest.mock('nanoid', () => ({ nanoid: () => 'mocked-id' }));

describe('ReportsService', () => {
  let service: ReportsService;
  let reportRepository: jest.Mocked<Repository<Report>>;
  let minioProvider: jest.Mocked<MinioProvider>;

  const mockReport: Partial<Report> = {
    id: 'mocked-id',
    title: 'Test Report',
    description: 'Test Description',
    status: ReportStatus.PENDING,
    location: {
      type: 'Point',
      coordinates: [7.686864, 45.070312],
    },
    address: 'Via Roma 1, Torino',
    images: [],
    userId: 'user-123',
    categoryId: 'cat-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Report),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: MinioProvider,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
            deleteFiles: jest.fn(),
            extractFileNameFromUrl: jest.fn((url: string) =>
              url.split('/').pop(),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    reportRepository = module.get(getRepositoryToken(Report));
    minioProvider = module.get(MinioProvider);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a report with uploaded images', async () => {
      const createDto: CreateReportDto = {
        title: 'New Report',
        description: 'New Description',
        longitude: 7.686864,
        latitude: 45.070312,
        address: 'Via Roma 1, Torino',
        categoryId: 'cat-123',
      };

      const mockFiles = [
        {
          originalname: 'test1.jpg',
          buffer: Buffer.from('test1'),
          mimetype: 'image/jpeg',
        },
        {
          originalname: 'test2.jpg',
          buffer: Buffer.from('test2'),
          mimetype: 'image/jpeg',
        },
      ] as Express.Multer.File[];

      const mockImageUrls = [
        'http://localhost:9000/bucket/reports/mocked-id/123-test1.jpg',
        'http://localhost:9000/bucket/reports/mocked-id/123-test2.jpg',
      ];

      minioProvider.uploadFile
        .mockResolvedValueOnce(mockImageUrls[0])
        .mockResolvedValueOnce(mockImageUrls[1]);

      const expectedReport = {
        id: 'mocked-id',
        ...createDto,
        location: {
          type: 'Point',
          coordinates: [7.686864, 45.070312],
        },
        status: ReportStatus.PENDING,
        userId: 'user-123',
        images: mockImageUrls,
      };

      reportRepository.create.mockReturnValue(
        expectedReport as unknown as Report,
      );
      reportRepository.save.mockResolvedValue(
        expectedReport as unknown as Report,
      );

      const result = await service.create(createDto, 'user-123', mockFiles);

      expect(minioProvider.uploadFile).toHaveBeenCalledTimes(2);
      expect(reportRepository.create).toHaveBeenCalledWith({
        id: 'mocked-id',
        title: createDto.title,
        description: createDto.description,
        address: createDto.address,
        categoryId: createDto.categoryId,
        location: {
          type: 'Point',
          coordinates: [7.686864, 45.070312],
        },
        userId: 'user-123',
        images: mockImageUrls,
      });
      expect(reportRepository.save).toHaveBeenCalledWith(expectedReport);
      expect(result).toEqual(expectedReport);
    });

    it('should create a report with minimum required fields and 1 image', async () => {
      const createDto: CreateReportDto = {
        title: 'Minimum Report',
        description: 'Minimum description',
        longitude: 7.686864,
        latitude: 45.070312,
        categoryId: 'cat-123',
      };

      const mockFiles = [
        {
          originalname: 'test.jpg',
          buffer: Buffer.from('test'),
          mimetype: 'image/jpeg',
        },
      ] as Express.Multer.File[];

      const mockImageUrl =
        'http://localhost:9000/bucket/reports/mocked-id/123-test.jpg';
      minioProvider.uploadFile.mockResolvedValue(mockImageUrl);

      const expectedReport = {
        id: 'mocked-id',
        title: 'Minimum Report',
        description: 'Minimum description',
        categoryId: 'cat-123',
        location: {
          type: 'Point',
          coordinates: [7.686864, 45.070312],
        },
        status: ReportStatus.PENDING,
        userId: 'user-123',
        images: [mockImageUrl],
      };

      reportRepository.create.mockReturnValue(
        expectedReport as unknown as Report,
      );
      reportRepository.save.mockResolvedValue(
        expectedReport as unknown as Report,
      );

      const result = await service.create(createDto, 'user-123', mockFiles);

      expect(minioProvider.uploadFile).toHaveBeenCalledTimes(1);
      expect(reportRepository.create).toHaveBeenCalledWith({
        id: 'mocked-id',
        title: 'Minimum Report',
        description: 'Minimum description',
        categoryId: 'cat-123',
        location: {
          type: 'Point',
          coordinates: [7.686864, 45.070312],
        },
        userId: 'user-123',
        images: [mockImageUrl],
      });
      expect(result).toEqual(expectedReport);
    });

    it('should create a report with 3 images (maximum)', async () => {
      const createDto: CreateReportDto = {
        title: 'Report with max images',
        description: 'Description with max images',
        longitude: 7.686864,
        latitude: 45.070312,
        categoryId: 'cat-123',
      };

      const mockFiles = [
        {
          originalname: 'test1.jpg',
          buffer: Buffer.from('test1'),
          mimetype: 'image/jpeg',
        },
        {
          originalname: 'test2.jpg',
          buffer: Buffer.from('test2'),
          mimetype: 'image/jpeg',
        },
        {
          originalname: 'test3.jpg',
          buffer: Buffer.from('test3'),
          mimetype: 'image/jpeg',
        },
      ] as Express.Multer.File[];

      const mockImageUrls = [
        'http://localhost:9000/bucket/reports/mocked-id/123-test1.jpg',
        'http://localhost:9000/bucket/reports/mocked-id/123-test2.jpg',
        'http://localhost:9000/bucket/reports/mocked-id/123-test3.jpg',
      ];

      minioProvider.uploadFile
        .mockResolvedValueOnce(mockImageUrls[0])
        .mockResolvedValueOnce(mockImageUrls[1])
        .mockResolvedValueOnce(mockImageUrls[2]);

      const expectedReport = {
        id: 'mocked-id',
        title: 'Report with max images',
        description: 'Description with max images',
        categoryId: 'cat-123',
        location: {
          type: 'Point',
          coordinates: [7.686864, 45.070312],
        },
        status: ReportStatus.PENDING,
        userId: 'user-123',
        images: mockImageUrls,
      };

      reportRepository.create.mockReturnValue(
        expectedReport as unknown as Report,
      );
      reportRepository.save.mockResolvedValue(
        expectedReport as unknown as Report,
      );

      const result = await service.create(createDto, 'user-123', mockFiles);

      expect(minioProvider.uploadFile).toHaveBeenCalledTimes(3);
      expect(result.images).toHaveLength(3);
      expect(result).toEqual(expectedReport);
    });

    it('should throw InternalServerErrorException if image upload fails', async () => {
      const createDto: CreateReportDto = {
        title: 'Report with failing upload',
        description: 'Description with failing upload',
        longitude: 7.686864,
        latitude: 45.070312,
        categoryId: 'cat-123',
      };

      const mockFiles = [
        {
          originalname: 'test.jpg',
          buffer: Buffer.from('test'),
          mimetype: 'image/jpeg',
        },
      ] as Express.Multer.File[];

      minioProvider.uploadFile.mockRejectedValue(new Error('Upload failed'));

      await expect(
        service.create(createDto, 'user-123', mockFiles),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        service.create(createDto, 'user-123', mockFiles),
      ).rejects.toThrow(REPORT_ERROR_MESSAGES.IMAGE_UPLOAD_FAILED);
    });
  });

  describe('findAll', () => {
    it('should return all reports without filters', async () => {
      const mockReports = [mockReport, { ...mockReport, id: 'report-2' }];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockReports),
      };

      reportRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAll();

      expect(reportRepository.createQueryBuilder).toHaveBeenCalledWith(
        'report',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'report.user',
        'user',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'report.category',
        'category',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'report.createdAt',
        'DESC',
      );
      expect(result).toEqual(mockReports);
    });

    it('should filter by status', async () => {
      const filters: FilterReportsDto = { status: ReportStatus.PENDING };
      const mockReports = [mockReport];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockReports),
      };

      reportRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAll(filters);

      expect(reportRepository.createQueryBuilder).toHaveBeenCalledWith(
        'report',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'report.status = :status',
        {
          status: ReportStatus.PENDING,
        },
      );
      expect(result).toEqual(mockReports);
    });

    it('should filter by categoryId', async () => {
      const filters: FilterReportsDto = { categoryId: 'cat-123' };
      const mockReports = [mockReport];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockReports),
      };

      reportRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAll(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'report.categoryId = :categoryId',
        {
          categoryId: 'cat-123',
        },
      );
      expect(result).toEqual(mockReports);
    });

    it('should filter by userId', async () => {
      const filters: FilterReportsDto = { userId: 'user-123' };
      const mockReports = [mockReport];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockReports),
      };

      reportRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAll(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'report.userId = :userId',
        {
          userId: 'user-123',
        },
      );
      expect(result).toEqual(mockReports);
    });

    it('should filter by bounding box', async () => {
      const filters: FilterReportsDto = {
        minLongitude: 7.0,
        maxLongitude: 8.0,
        minLatitude: 45.0,
        maxLatitude: 46.0,
      };
      const mockReports = [mockReport];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockReports),
      };

      reportRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAll(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        `ST_Contains(
          ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326),
          report.location
        )`,
        {
          minLng: 7.0,
          minLat: 45.0,
          maxLng: 8.0,
          maxLat: 46.0,
        },
      );
      expect(result).toEqual(mockReports);
    });

    it('should filter by radius search', async () => {
      const filters: FilterReportsDto = {
        searchLongitude: 7.686864,
        searchLatitude: 45.070312,
        radiusMeters: 5000,
      };
      const mockReports = [mockReport];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockReports),
      };

      reportRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAll(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        `ST_DWithin(
          report.location::geography,
          ST_SetSRID(ST_MakePoint(:searchLng, :searchLat), 4326)::geography,
          :radius
        )`,
        {
          searchLng: 7.686864,
          searchLat: 45.070312,
          radius: 5000,
        },
      );
      expect(result).toEqual(mockReports);
    });

    it('should apply multiple filters combined', async () => {
      const filters: FilterReportsDto = {
        status: ReportStatus.PENDING,
        categoryId: 'cat-123',
        userId: 'user-123',
      };
      const mockReports = [mockReport];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockReports),
      };

      reportRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAll(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'report.status = :status',
        {
          status: ReportStatus.PENDING,
        },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'report.categoryId = :categoryId',
        {
          categoryId: 'cat-123',
        },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'report.userId = :userId',
        {
          userId: 'user-123',
        },
      );
      expect(result).toEqual(mockReports);
    });
  });

  describe('findOne', () => {
    it('should return a report by id', async () => {
      reportRepository.findOne.mockResolvedValue(
        mockReport as unknown as Report,
      );

      const result = await service.findOne('mocked-id');

      expect(reportRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'mocked-id' },
        relations: ['user', 'category'],
      });
      expect(result).toEqual(mockReport);
    });

    it('should throw NotFoundException if report not found', async () => {
      reportRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND('non-existent-id'),
      );
    });
  });

  describe('findNearby', () => {
    it('should return nearby reports with distances', async () => {
      const mockNearbyReports = [
        { ...mockReport, distance: 150.5 },
        { ...mockReport, id: 'report-2', distance: 825.3 },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [mockReport, { ...mockReport, id: 'report-2' }],
          raw: [{ distance: 150.5 }, { distance: 825.3 }],
        }),
      };

      reportRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findNearby(7.686864, 45.070312, 5000);

      expect(reportRepository.createQueryBuilder).toHaveBeenCalledWith(
        'report',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        `ST_DWithin(
          report.location::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
          :radius
        )`,
        { lng: 7.686864, lat: 45.070312, radius: 5000 },
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        `ST_Distance(
          report.location::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
        )`,
        'distance',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('distance', 'ASC');
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('distance', 150.5);
      expect(result[1]).toHaveProperty('distance', 825.3);
    });

    it('should return empty array if no reports nearby', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [],
          raw: [],
        }),
      };

      reportRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findNearby(0, 0, 1000);

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a report with new data', async () => {
      const updateDto: UpdateReportDto = {
        title: 'Updated Title',
        status: ReportStatus.IN_PROGRESS,
      };

      const updatedReport = { ...mockReport, ...updateDto };

      reportRepository.findOne.mockResolvedValue(
        mockReport as unknown as Report,
      );
      reportRepository.save.mockResolvedValue(
        updatedReport as unknown as Report,
      );

      const result = await service.update('mocked-id', updateDto);

      expect(reportRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'mocked-id' },
        relations: ['user', 'category'],
      });
      expect(reportRepository.save).toHaveBeenCalledWith({
        ...mockReport,
        title: 'Updated Title',
        status: ReportStatus.IN_PROGRESS,
      });
      expect(result).toEqual(updatedReport);
    });

    it('should update location when longitude and latitude provided', async () => {
      const updateDto: UpdateReportDto = {
        longitude: 8.0,
        latitude: 46.0,
      };

      const updatedReport = {
        ...mockReport,
        location: {
          type: 'Point',
          coordinates: [8.0, 46.0],
        },
      };

      reportRepository.findOne.mockResolvedValue(mockReport as Report);
      reportRepository.save.mockResolvedValue(updatedReport as Report);

      const result = await service.update('mocked-id', updateDto);

      expect(reportRepository.save).toHaveBeenCalledWith({
        ...mockReport,
        location: {
          type: 'Point',
          coordinates: [8.0, 46.0],
        },
      });
      expect(result.location).toEqual({
        type: 'Point',
        coordinates: [8.0, 46.0],
      });
    });

    it('should throw NotFoundException if report not found', async () => {
      reportRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent-id', {})).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update('non-existent-id', {})).rejects.toThrow(
        REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND('non-existent-id'),
      );
    });
  });

  describe('remove', () => {
    it('should delete a report and its images from MinIO', async () => {
      const reportWithImages = {
        ...mockReport,
        images: [
          'http://localhost:9000/bucket/reports/mocked-id/123-test1.jpg',
          'http://localhost:9000/bucket/reports/mocked-id/123-test2.jpg',
        ],
      };

      reportRepository.findOne.mockResolvedValue(
        reportWithImages as unknown as Report,
      );
      reportRepository.remove.mockResolvedValue(
        reportWithImages as unknown as Report,
      );
      minioProvider.extractFileNameFromUrl.mockImplementation(
        (url) => url.split('/').pop() || '',
      );

      await service.remove('mocked-id');

      expect(reportRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'mocked-id' },
        relations: ['user', 'category'],
      });
      expect(minioProvider.deleteFiles).toHaveBeenCalledWith([
        '123-test1.jpg',
        '123-test2.jpg',
      ]);
      expect(reportRepository.remove).toHaveBeenCalledWith(reportWithImages);
    });

    it('should delete a report without images', async () => {
      reportRepository.findOne.mockResolvedValue(
        mockReport as unknown as Report,
      );
      reportRepository.remove.mockResolvedValue(
        mockReport as unknown as Report,
      );

      await service.remove('mocked-id');

      expect(reportRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'mocked-id' },
        relations: ['user', 'category'],
      });
      expect(minioProvider.deleteFiles).not.toHaveBeenCalled();
      expect(reportRepository.remove).toHaveBeenCalledWith(mockReport);
    });

    it('should throw NotFoundException if report not found', async () => {
      reportRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('non-existent-id')).rejects.toThrow(
        REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND('non-existent-id'),
      );
    });

    it('should throw InternalServerErrorException if image deletion fails', async () => {
      const reportWithImages = {
        ...mockReport,
        images: ['http://localhost:9000/bucket/reports/id1/image1.jpg'],
      } as Report;

      reportRepository.findOne.mockResolvedValue(reportWithImages);
      minioProvider.extractFileNameFromUrl.mockReturnValue('image1.jpg');
      minioProvider.deleteFiles.mockRejectedValue(new Error('MinIO error'));

      await expect(service.remove('mocked-id')).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.remove('mocked-id')).rejects.toThrow(
        REPORT_ERROR_MESSAGES.IMAGE_DELETE_FAILED,
      );
    });
  });
});
