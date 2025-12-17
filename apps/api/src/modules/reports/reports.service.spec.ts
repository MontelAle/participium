import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateReportDto,
  FilterReportsDto,
  UpdateReportDto,
} from '../../common/dto/report.dto';
import { Boundary } from '../../common/entities/boundary.entity';
import { Category } from '../../common/entities/category.entity';
import { Report, ReportStatus } from '../../common/entities/report.entity';
import { User } from '../../common/entities/user.entity';
import { MinioProvider } from '../../providers/minio/minio.provider';
import { REPORT_ERROR_MESSAGES } from './constants/error-messages';
import { ReportsService } from './reports.service';

jest.mock('nanoid', () => ({ nanoid: () => 'mocked-id' }));

const createMockQueryBuilder = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
  getRawMany: jest.fn().mockResolvedValue([]),
  getRawAndEntities: jest.fn().mockResolvedValue({ entities: [], raw: [] }),
  getOne: jest.fn().mockResolvedValue(null),
  setParameters: jest.fn().mockReturnThis(),
  getRawOne: jest.fn().mockResolvedValue({}),
});

const createMockBoundaryQueryBuilder = (withinBoundary: boolean = true) => ({
  where: jest.fn().mockReturnThis(),
  getOne: jest
    .fn()
    .mockResolvedValue(
      withinBoundary
        ? { id: 'torino', name: 'torino', label: 'Comune di Torino' }
        : null,
    ),
});

describe('ReportsService', () => {
  let service: ReportsService;
  let reportRepository: jest.Mocked<Repository<Report>>;
  let categoryRepository: jest.Mocked<Repository<Category>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let boundaryRepository: jest.Mocked<Repository<Boundary>>;
  let minioProvider: jest.Mocked<MinioProvider>;

  const mockCitizenUser = { id: 'user-123', role: { name: 'user' } } as User;
  const mockOtherCitizenUser = {
    id: 'citizen-123',
    role: { name: 'user' },
  } as User;
  const mockMunicipalUser = {
    id: 'officer-999',
    role: { name: 'tech_officer' },
  } as User;

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
    isAnonymous: false,
    images: [],
    userId: mockCitizenUser.id,
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
            count: jest.fn(),
            createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
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
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Boundary),
          useValue: {
            createQueryBuilder: jest.fn(() =>
              createMockBoundaryQueryBuilder(true),
            ),
          },
        },
        {
          provide: MinioProvider,
          useValue: {
            uploadFile: jest.fn(),
            extractFileNameFromUrl: jest.fn((url: string) =>
              url.split('/').pop(),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    reportRepository = module.get(getRepositoryToken(Report));
    categoryRepository = module.get(getRepositoryToken(Category));
    boundaryRepository = module.get(getRepositoryToken(Boundary));
    minioProvider = module.get(MinioProvider);
    userRepository = module.get(getRepositoryToken(User));
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
        isAnonymous: false,
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
        isAnonymous: false,
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
        isAnonymous: false,
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
        isAnonymous: false,
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
        isAnonymous: false,
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
        isAnonymous: false,
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
        isAnonymous: false,
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
        isAnonymous: false,
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

    it('should throw BadRequestException if coordinates are outside municipal boundaries', async () => {
      const createDto: CreateReportDto = {
        title: 'Report outside boundary',
        description: 'Description outside boundary',
        longitude: 10.0,
        latitude: 44.0,
        categoryId: 'cat-123',
        isAnonymous: false,
      };

      const mockFiles = [
        {
          originalname: 'test.jpg',
          buffer: Buffer.from('test'),
          mimetype: 'image/jpeg',
        },
      ] as Express.Multer.File[];

      boundaryRepository.createQueryBuilder = jest.fn(() =>
        createMockBoundaryQueryBuilder(false),
      ) as any;

      await expect(
        service.create(createDto, 'user-123', mockFiles),
      ).rejects.toThrow(
        new BadRequestException(
          REPORT_ERROR_MESSAGES.COORDINATES_OUTSIDE_BOUNDARY,
        ),
      );
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

      const result = await service.findAll(mockCitizenUser);

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

      // Use municipal user (not citizen) for status filters to work
      const result = await service.findAll(mockMunicipalUser, filters);

      expect(reportRepository.createQueryBuilder).toHaveBeenCalledWith(
        'report',
      );
      // Municipal users (not pr_officer) get status filter applied
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

      const result = await service.findAll(mockOtherCitizenUser, filters);

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

      const result = await service.findAll(mockCitizenUser, filters);

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

      const result = await service.findAll(mockCitizenUser, filters);

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

      const result = await service.findAll(mockCitizenUser, filters);

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

      // Use municipal user (not citizen) for status filters to work
      const result = await service.findAll(mockMunicipalUser, filters);

      // Municipal users get status filter applied
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

    it('should exclude rejected reports from other users for citizen users', async () => {
      const filters: FilterReportsDto = {};
      const mockReports = [
        { ...mockReport, status: ReportStatus.PENDING },
        {
          ...mockReport,
          id: 'own-rejected',
          status: ReportStatus.REJECTED,
          userId: 'user-123',
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockReports),
      };

      reportRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAll(mockCitizenUser, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        `(report.status != 'rejected' OR report.userId = :viewerId)`,
        { viewerId: 'user-123' },
      );
      expect(result).toEqual(mockReports);
    });

    it('should include own rejected reports for citizen users', async () => {
      const filters: FilterReportsDto = {};
      const ownRejectedReport = {
        ...mockReport,
        id: 'own-rejected',
        status: ReportStatus.REJECTED,
        userId: 'user-123',
      };
      const mockReports = [ownRejectedReport];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockReports),
      };

      reportRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAll(mockCitizenUser, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        `(report.status != 'rejected' OR report.userId = :viewerId)`,
        { viewerId: 'user-123' },
      );
      expect(result).toEqual(mockReports);
    });

    it('should NOT filter rejected reports for municipal users', async () => {
      const mockMunicipalUser = {
        id: 'officer-999',
        role: { name: 'tech_officer' },
      } as User;

      const filters: FilterReportsDto = {};
      const mockReports = [
        { ...mockReport, status: ReportStatus.PENDING },
        {
          ...mockReport,
          id: 'rejected-1',
          status: ReportStatus.REJECTED,
          userId: 'user-123',
        },
        {
          ...mockReport,
          id: 'rejected-2',
          status: ReportStatus.REJECTED,
          userId: 'other-user',
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockReports),
      };

      reportRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAll(mockMunicipalUser, filters);

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        `(report.status != 'rejected' OR report.userId = :viewerId)`,
        expect.any(Object),
      );
      expect(result).toEqual(mockReports);
    });

    it('should FORCE status=pending if viewer is a pr_officer, ignoring other status filters', async () => {
      const prOfficerUser = {
        id: 'pr-1',
        role: { name: 'pr_officer' },
      } as User;
      const filters: FilterReportsDto = { status: ReportStatus.RESOLVED };
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

      await service.findAll(prOfficerUser, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'report.status = :forcedStatus',
        { forcedStatus: 'pending' },
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'report.status = :status',
        { status: ReportStatus.RESOLVED },
      );
    });

    it('should filter reports to only those assigned to external maintainer', async () => {
      const externalMaintainer = {
        id: 'ext-maint-1',
        role: { name: 'external_maintainer' },
      } as User;
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

      await service.findAll(externalMaintainer);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'report.assignedExternalMaintainerId = :viewerId',
        { viewerId: 'ext-maint-1' },
      );
    });
  });

  describe('findOne', () => {
    it('should return a standard report by id', async () => {
      const standardReport = { ...mockReport, isAnonymous: false };
      reportRepository.findOne.mockResolvedValue(
        standardReport as unknown as Report,
      );

      const result = await service.findOne('mocked-id', mockCitizenUser);

      expect(reportRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'mocked-id' },
        relations: [
          'user',
          'user.role',
          'category',
          'assignedOfficer',
          'assignedExternalMaintainer',
        ],
      });
      expect(result).toEqual(mockReport);
    });

    it('should sanitize user info if report is anonymous and viewer is other citizen user', async () => {
      const anonymousReport = {
        ...mockReport,
        userId: 'user-123',
        user: mockCitizenUser,
        isAnonymous: true,
      };

      reportRepository.findOne.mockResolvedValue(
        anonymousReport as unknown as Report,
      );

      const result = await service.findOne('mocked-id', mockOtherCitizenUser);

      expect(result.user).toBeNull();
      expect(result.id).toBe('mocked-id');
    });

    it('should NOT sanitize info if viewer is the owner', async () => {
      const anonymousReport = {
        ...mockReport,
        userId: 'user-123',
        user: mockCitizenUser,
        isAnonymous: true,
      };
      reportRepository.findOne.mockResolvedValue(
        anonymousReport as unknown as Report,
      );

      const result = await service.findOne('mocked-id', mockCitizenUser);

      expect(result.user).toEqual(mockCitizenUser);
    });

    it('should show user info if report is anonymous but viewer has privileged role (tech_officer)', async () => {
      const anonymousReport = {
        ...mockReport,
        userId: 'user-123',
        user: mockCitizenUser,
        isAnonymous: true,
      };

      const mockOfficerUser = {
        id: 'officer-999',
        role: { name: 'tech_officer' },
      } as User;

      reportRepository.findOne.mockResolvedValue(
        anonymousReport as unknown as Report,
      );

      const result = await service.findOne('mocked-id', mockOfficerUser);

      expect(result.user).toEqual(mockCitizenUser);
      expect(result.id).toBe('mocked-id');
    });

    it('should throw NotFoundException if report not found', async () => {
      reportRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent-id', mockCitizenUser),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne('non-existent-id', mockCitizenUser),
      ).rejects.toThrow(
        REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND('non-existent-id'),
      );
    });

    it('should throw NotFoundException for citizen trying to access rejected report of another user', async () => {
      const rejectedReport = {
        ...mockReport,
        id: 'rejected-123',
        status: ReportStatus.REJECTED,
        userId: 'other-user-456',
      };

      reportRepository.findOne.mockResolvedValue(
        rejectedReport as unknown as Report,
      );

      await expect(
        service.findOne('rejected-123', mockCitizenUser),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne('rejected-123', mockCitizenUser),
      ).rejects.toThrow(REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND('rejected-123'));
    });

    it('should allow citizen to access their own rejected report', async () => {
      const ownRejectedReport = {
        ...mockReport,
        id: 'own-rejected',
        status: ReportStatus.REJECTED,
        userId: 'user-123',
        user: mockCitizenUser,
      };

      reportRepository.findOne.mockResolvedValue(
        ownRejectedReport as unknown as Report,
      );

      const result = await service.findOne('own-rejected', mockCitizenUser);

      expect(result.id).toBe('own-rejected');
      expect(result.status).toBe(ReportStatus.REJECTED);
      expect(result.userId).toBe('user-123');
    });

    it('should throw NotFoundException for external maintainer trying to access report not assigned to them', async () => {
      const externalMaintainer = {
        id: 'ext-maint-1',
        role: { name: 'external_maintainer' },
      } as User;

      const reportNotAssigned = {
        ...mockReport,
        id: 'report-123',
        assignedExternalMaintainerId: 'other-ext-maint',
      };

      reportRepository.findOne.mockResolvedValue(
        reportNotAssigned as unknown as Report,
      );

      await expect(
        service.findOne('report-123', externalMaintainer),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne('report-123', externalMaintainer),
      ).rejects.toThrow(REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND('report-123'));
    });

    it('should allow external maintainer to access report assigned to them', async () => {
      const externalMaintainer = {
        id: 'ext-maint-1',
        role: { name: 'external_maintainer' },
      } as User;

      const assignedReport = {
        ...mockReport,
        id: 'assigned-report',
        assignedExternalMaintainerId: 'ext-maint-1',
      };

      reportRepository.findOne.mockResolvedValue(
        assignedReport as unknown as Report,
      );

      const result = await service.findOne(
        'assigned-report',
        externalMaintainer,
      );

      expect(result.id).toBe('assigned-report');
      expect(result.assignedExternalMaintainerId).toBe('ext-maint-1');
    });

    it('should allow municipal user to access any rejected report', async () => {
      const mockMunicipalUser = {
        id: 'officer-999',
        role: { name: 'tech_officer' },
      } as User;

      const rejectedReport = {
        ...mockReport,
        id: 'rejected-123',
        status: ReportStatus.REJECTED,
        userId: 'other-user-456',
      };

      reportRepository.findOne.mockResolvedValue(
        rejectedReport as unknown as Report,
      );

      const result = await service.findOne('rejected-123', mockMunicipalUser);

      expect(result.id).toBe('rejected-123');
      expect(result.status).toBe(ReportStatus.REJECTED);
    });
  });

  describe('findNearby', () => {
    it('should return nearby reports with distances', async () => {
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

      const result = await service.findNearby(
        7.686864,
        45.070312,
        5000,
        mockCitizenUser,
      );

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

      const result = await service.findNearby(0, 0, 1000, mockCitizenUser);

      expect(result).toEqual([]);
    });

    it('should exclude all rejected reports from nearby search', async () => {
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

      await service.findNearby(7.686864, 45.070312, 5000, mockCitizenUser);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'report.status != :rejectedStatus',
        { rejectedStatus: 'rejected' },
      );
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
        relations: [
          'user',
          'user.role',
          'category',
          'assignedOfficer',
          'assignedExternalMaintainer',
        ],
      });
      expect(reportRepository.save).toHaveBeenCalledWith({
        ...mockReport,
        title: 'Updated Title',
        status: ReportStatus.IN_PROGRESS,
      });
      expect(result).toEqual(updatedReport);
    });

    it('should set processedById when status is assigned by a pr_officer', async () => {
      const mockActor = {
        id: 'pr-officer-1',
        role: { name: 'pr_officer' },
      } as User;
      const updateDto: UpdateReportDto = {
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 'tech-1',
      };

      const mockTechOfficer = { id: 'tech-1' } as User;

      reportRepository.findOne.mockResolvedValue(mockReport as Report);
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockTechOfficer);

      reportRepository.save.mockImplementation(
        async (entity) => entity as Report,
      );

      const result = await service.update('mocked-id', updateDto, mockActor);

      expect(result.processedById).toBe('pr-officer-1');
      expect(result.assignedOfficerId).toBe('tech-1');
      expect(reportRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          processedById: 'pr-officer-1',
          status: ReportStatus.ASSIGNED,
        }),
      );
    });

    it('should set processedById when status is rejected by an actor', async () => {
      const mockActor = {
        id: 'pr-officer-1',
        role: { name: 'pr_officer' },
      } as User;
      const updateDto: UpdateReportDto = {
        status: ReportStatus.REJECTED,
        explanation: 'Invalid report',
      };

      reportRepository.findOne.mockResolvedValue(mockReport as Report);
      reportRepository.save.mockImplementation(
        async (entity) => entity as Report,
      );

      const result = await service.update('mocked-id', updateDto, mockActor);

      expect(result.processedById).toBe('pr-officer-1');
      expect(reportRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          processedById: 'pr-officer-1',
          status: ReportStatus.REJECTED,
        }),
      );
    });

    it('should update assignedOfficerId when status is assigned and officerId is provided', async () => {
      const mockOfficer = {
        id: 'officer-1',
        username: 'officer_jane',
        role: { name: 'tech_officer' },
      } as User;

      const updateDto: UpdateReportDto = {
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 'officer-1',
      };

      reportRepository.findOne.mockResolvedValue(mockReport as Report);
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockOfficer);

      const expectedSavedReport = {
        ...mockReport,
        status: ReportStatus.ASSIGNED,
        assignedOfficer: mockOfficer,
      };

      reportRepository.save.mockResolvedValue(expectedSavedReport as Report);

      await service.update('mocked-id', updateDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'officer-1' },
        relations: ['office'],
      });
      expect(reportRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ReportStatus.ASSIGNED,
          assignedOfficer: mockOfficer,
        }),
      );
    });

    it('should auto-assign to officer with fewest reports when status is assigned without officerId', async () => {
      const mockCategory = {
        id: 'cat-123',
        name: 'Road Issues',
        office: { id: 'office-1', name: 'Public Works' },
      } as Category;

      const mockOfficer1 = {
        id: 'officer-1',
        role: { name: 'tech_officer' },
      } as User;
      const mockOfficer2 = {
        id: 'officer-2',
        role: { name: 'tech_officer' },
      } as User;

      const reportWithCategory = {
        ...mockReport,
        category: mockCategory,
      } as Report;
      const updateDto: UpdateReportDto = { status: ReportStatus.ASSIGNED };

      reportRepository.findOne.mockResolvedValue(reportWithCategory);
      (userRepository.find as jest.Mock).mockResolvedValue([
        mockOfficer1,
        mockOfficer2,
      ]);

      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { id: 'officer-1', count: '3' },
      ]);
      reportRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const expectedSavedReport = {
        ...reportWithCategory,
        status: ReportStatus.ASSIGNED,
        assignedOfficer: mockOfficer2,
      };

      reportRepository.save.mockResolvedValue(expectedSavedReport as Report);

      await service.update('mocked-id', updateDto);

      expect(userRepository.find).toHaveBeenCalledWith({
        where: { officeId: 'office-1' },
        relations: ['role'],
      });
      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith(
        'report.assignedOfficerId',
      );

      expect(reportRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ReportStatus.ASSIGNED,
          assignedOfficer: mockOfficer2,
        }),
      );
    });

    it('should auto-assign when status is assigned without officerId and category is loaded separately', async () => {
      const mockCategory = {
        id: 'cat-123',
        office: { id: 'office-1' },
      } as Category;
      const mockOfficer = {
        id: 'officer-1',
        role: { name: 'tech_officer' },
      } as User;
      const reportWithoutCategory = {
        ...mockReport,
        categoryId: 'cat-123',
        category: null,
      } as Report;

      reportRepository.findOne.mockResolvedValue(reportWithoutCategory);
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      (userRepository.find as jest.Mock).mockResolvedValue([mockOfficer]);

      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { id: 'officer-1', count: '2' },
      ]);
      reportRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      reportRepository.save.mockImplementation(async (r) => r as Report);

      await service.update('mocked-id', { status: ReportStatus.ASSIGNED });

      expect(categoryRepository.findOne).toHaveBeenCalled();
      expect(reportRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ assignedOfficer: mockOfficer }),
      );
    });

    it('should not auto-assign if no officers are found in the office', async () => {
      const mockCategory = {
        id: 'cat-123',
        name: 'Road Issues',
        office: {
          id: 'office-1',
          name: 'Public Works',
        },
      } as Category;

      const reportWithCategory = {
        ...mockReport,
        category: mockCategory,
      } as Report;

      const updateDto: UpdateReportDto = {
        status: ReportStatus.ASSIGNED,
      };

      reportRepository.findOne.mockResolvedValue(reportWithCategory);
      (userRepository.find as jest.Mock).mockResolvedValue([]);

      const expectedSavedReport = {
        ...reportWithCategory,
        status: ReportStatus.ASSIGNED,
        assignedOfficer: undefined,
      };

      reportRepository.save.mockResolvedValue(expectedSavedReport as Report);

      await service.update('mocked-id', updateDto);

      expect(userRepository.find).toHaveBeenCalledWith({
        where: { officeId: 'office-1' },
        relations: ['role'],
      });

      expect(reportRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ReportStatus.ASSIGNED,
        }),
      );
    });

    it('should filter out pr_officers and only auto-assign to technical officers', async () => {
      const mockCategory = {
        id: 'cat-123',
        office: { id: 'office-1' },
      } as Category;
      const mockTechOfficer = {
        id: 'tech-1',
        role: { name: 'tech_officer' },
      } as User;
      const mockPrOfficer = {
        id: 'pr-1',
        role: { name: 'pr_officer' },
      } as User;
      const reportWithCategory = {
        ...mockReport,
        category: mockCategory,
      } as Report;

      reportRepository.findOne.mockResolvedValue(reportWithCategory);
      (userRepository.find as jest.Mock).mockResolvedValue([
        mockTechOfficer,
        mockPrOfficer,
      ]);

      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      reportRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      reportRepository.save.mockImplementation(async (r) => r as Report);

      await service.update('mocked-id', { status: ReportStatus.ASSIGNED });

      expect(reportRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ assignedOfficer: mockTechOfficer }),
      );
    });

    it('should auto-assign when assignedOfficerId is empty string', async () => {
      const mockCategory = {
        id: 'cat-123',
        office: { id: 'office-1' },
      } as Category;
      const mockOfficer = {
        id: 'officer-1',
        role: { name: 'tech_officer' },
      } as User;
      const reportWithCategory = {
        ...mockReport,
        category: mockCategory,
      } as Report;

      reportRepository.findOne.mockResolvedValue(reportWithCategory);
      (userRepository.find as jest.Mock).mockResolvedValue([mockOfficer]);

      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      reportRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      reportRepository.save.mockImplementation(async (r) => r as Report);

      await service.update('mocked-id', {
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: '',
      });

      expect(reportRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ assignedOfficer: mockOfficer }),
      );
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

    it('should update categoryId when provided', async () => {
      const mockCategory = {
        id: 'cat-456',
        name: 'New Category',
      } as Category;

      const updateDto: UpdateReportDto = {
        categoryId: 'cat-456',
      };

      reportRepository.findOne.mockResolvedValue(mockReport as Report);
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      reportRepository.save.mockResolvedValue({
        ...mockReport,
        category: mockCategory,
      } as Report);

      await service.update('mocked-id', updateDto);

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cat-456' },
        relations: ['office'],
      });
      expect(reportRepository.save).toHaveBeenCalled();
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

    it('should assign external maintainer when assignedExternalMaintainerId is provided', async () => {
      const mockExternalMaintainer = {
        id: 'ext-maint-1',
        role: { name: 'external_maintainer' },
      } as User;

      const updateDto: UpdateReportDto = {
        assignedExternalMaintainerId: 'ext-maint-1',
      };

      reportRepository.findOne.mockResolvedValue(mockReport as Report);
      userRepository.findOne.mockResolvedValue(mockExternalMaintainer);
      reportRepository.save.mockImplementation(async (r) => r as Report);

      await service.update('mocked-id', updateDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'ext-maint-1' },
        relations: ['role', 'office'],
      });
      expect(reportRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedExternalMaintainer: mockExternalMaintainer,
          assignedExternalMaintainerId: 'ext-maint-1',
        }),
      );
    });

    it('should throw BadRequestException when assigning invalid external maintainer', async () => {
      const mockRegularUser = {
        id: 'user-1',
        role: { name: 'user' },
      } as User;

      const updateDto: UpdateReportDto = {
        assignedExternalMaintainerId: 'user-1',
      };

      reportRepository.findOne.mockResolvedValue(mockReport as Report);
      userRepository.findOne.mockResolvedValue(mockRegularUser);

      await expect(service.update('mocked-id', updateDto)).rejects.toThrow(
        new BadRequestException(
          REPORT_ERROR_MESSAGES.EXTERNAL_MAINTAINER_INVALID_USER,
        ),
      );
    });

    it('should allow external maintainer to change status from assigned to in_progress', async () => {
      const externalMaintainer = {
        id: 'ext-maint-1',
        role: { name: 'external_maintainer' },
      } as User;

      const reportAssigned = {
        ...mockReport,
        status: ReportStatus.ASSIGNED,
      } as Report;

      const updateDto: UpdateReportDto = {
        status: ReportStatus.IN_PROGRESS,
      };

      reportRepository.findOne.mockResolvedValue(reportAssigned);
      reportRepository.save.mockImplementation(async (r) => r as Report);

      await service.update('mocked-id', updateDto, externalMaintainer);

      expect(reportRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ReportStatus.IN_PROGRESS,
        }),
      );
    });

    it('should allow external maintainer to change status from in_progress to resolved', async () => {
      const externalMaintainer = {
        id: 'ext-maint-1',
        role: { name: 'external_maintainer' },
      } as User;

      const reportInProgress = {
        ...mockReport,
        status: ReportStatus.IN_PROGRESS,
      } as Report;

      const updateDto: UpdateReportDto = {
        status: ReportStatus.RESOLVED,
      };

      reportRepository.findOne.mockResolvedValue(reportInProgress);
      reportRepository.save.mockImplementation(async (r) => r as Report);

      await service.update('mocked-id', updateDto, externalMaintainer);

      expect(reportRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ReportStatus.RESOLVED,
        }),
      );
    });

    it('should throw BadRequestException when external maintainer tries invalid status transition', async () => {
      const externalMaintainer = {
        id: 'ext-maint-1',
        role: { name: 'external_maintainer' },
      } as User;

      const reportInProgress = {
        ...mockReport,
        status: ReportStatus.IN_PROGRESS,
      } as Report;

      const updateDto: UpdateReportDto = {
        status: ReportStatus.ASSIGNED,
      };

      reportRepository.findOne.mockResolvedValue(reportInProgress);

      await expect(
        service.update('mocked-id', updateDto, externalMaintainer),
      ).rejects.toThrow(
        new BadRequestException(
          REPORT_ERROR_MESSAGES.EXTERNAL_MAINTAINER_INVALID_STATUS_TRANSITION(
            ReportStatus.IN_PROGRESS,
            ReportStatus.ASSIGNED,
          ),
        ),
      );
    });

    it('should throw BadRequestException when external maintainer tries to reject report', async () => {
      const externalMaintainer = {
        id: 'ext-maint-1',
        role: { name: 'external_maintainer' },
      } as User;

      const reportAssigned = {
        ...mockReport,
        status: ReportStatus.ASSIGNED,
        assignedExternalMaintainerId: 'ext-maint-1',
      } as Report;

      const updateDto: UpdateReportDto = {
        status: ReportStatus.REJECTED,
      };

      reportRepository.findOne.mockResolvedValue(reportAssigned);

      await expect(
        service.update('mocked-id', updateDto, externalMaintainer),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when external maintainer tries to update report not assigned to them', async () => {
      const externalMaintainer = {
        id: 'ext-maint-1',
        role: { name: 'external_maintainer' },
      } as User;

      const reportAssignedToOther = {
        ...mockReport,
        status: ReportStatus.ASSIGNED,
        assignedExternalMaintainerId: 'ext-maint-2',
      } as Report;

      const updateDto: UpdateReportDto = {
        status: ReportStatus.IN_PROGRESS,
      };

      reportRepository.findOne.mockResolvedValue(reportAssignedToOther);

      await expect(
        service.update('mocked-id', updateDto, externalMaintainer),
      ).rejects.toThrow(
        new BadRequestException(
          REPORT_ERROR_MESSAGES.EXTERNAL_MAINTAINER_NOT_ASSIGNED_TO_REPORT,
        ),
      );
    });

    it('should throw BadRequestException when external maintainer office does not match category external office', async () => {
      const mockExternalMaintainer = {
        id: 'ext-maint-1',
        officeId: 'external-office-1',
        role: { name: 'external_maintainer' },
      } as User;

      const mockCategory = {
        id: 'cat-1',
        externalOffice: { id: 'external-office-2', name: 'Wrong External Office' },
      } as Category;

      const reportWithoutCategory = {
        ...mockReport,
        categoryId: 'cat-1',
        category: null,
      } as Report;

      const updateDto: UpdateReportDto = {
        assignedExternalMaintainerId: 'ext-maint-1',
      };

      reportRepository.findOne.mockResolvedValue(reportWithoutCategory);
      userRepository.findOne.mockResolvedValue(mockExternalMaintainer);
      categoryRepository.findOne.mockResolvedValue(mockCategory);

      await expect(
        service.update('mocked-id', updateDto),
      ).rejects.toThrow(
        new BadRequestException(
          REPORT_ERROR_MESSAGES.EXTERNAL_MAINTAINER_NOT_FOR_CATEGORY(
            'ext-maint-1',
            'cat-1',
          ),
        ),
      );

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        relations: ['externalOffice'],
      });
    });

    it('should remove external maintainer when assignedExternalMaintainerId is explicitly null', async () => {
      const reportWithExtMaintainer = {
        ...mockReport,
        assignedExternalMaintainerId: 'ext-maint-1',
        assignedExternalMaintainer: {
          id: 'ext-maint-1',
          role: { name: 'external_maintainer' },
        } as User,
      } as Report;

      const updateDto: UpdateReportDto = {
        assignedExternalMaintainerId: null,
      };

      reportRepository.findOne.mockResolvedValue(reportWithExtMaintainer);
      reportRepository.save.mockImplementation(async (r) => r as Report);

      await service.update('mocked-id', updateDto);

      expect(reportRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedExternalMaintainer: null,
          assignedExternalMaintainerId: null,
        }),
      );
    });

    it('should allow external maintainer to update report without changing status', async () => {
      const externalMaintainer = {
        id: 'ext-maint-1',
        role: { name: 'external_maintainer' },
      } as User;

      const reportAssigned = {
        ...mockReport,
        status: ReportStatus.ASSIGNED,
      } as Report;

      const updateDto: UpdateReportDto = {
        explanation: 'Work in progress',
      };

      reportRepository.findOne.mockResolvedValue(reportAssigned);
      reportRepository.save.mockImplementation(async (r) => r as Report);

      await service.update('mocked-id', updateDto, externalMaintainer);

      expect(reportRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          explanation: 'Work in progress',
        }),
      );
    });

    it('should throw NotFoundException when officer does not exist', async () => {
      const updateDto: UpdateReportDto = {
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 'invalid-officer',
      };

      reportRepository.findOne.mockResolvedValue(mockReport as Report);
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.update('mocked-id', updateDto)).rejects.toThrow(
        new NotFoundException(
          REPORT_ERROR_MESSAGES.OFFICER_NOT_FOUND('invalid-officer'),
        ),
      );
    });

    it('should throw BadRequestException when officer does not belong to category office', async () => {
      const mockCategory = {
        id: 'cat-1',
        office: { id: 'office-1', name: 'Infrastructure' },
      } as Category;

      const mockOfficer = {
        id: 'officer-1',
        officeId: 'office-2',
        office: { id: 'office-2', name: 'Environment' },
      } as User;

      const reportWithCategory = {
        ...mockReport,
        categoryId: 'cat-1',
        category: mockCategory,
      } as Report;

      const updateDto: UpdateReportDto = {
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 'officer-1',
      };

      reportRepository.findOne.mockResolvedValue(reportWithCategory);
      userRepository.findOne.mockResolvedValue(mockOfficer);

      await expect(service.update('mocked-id', updateDto)).rejects.toThrow(
        new BadRequestException(
          REPORT_ERROR_MESSAGES.OFFICER_NOT_FOR_CATEGORY('officer-1', 'cat-1'),
        ),
      );
    });

    it('should successfully assign officer that belongs to correct office', async () => {
      const mockCategory = {
        id: 'cat-1',
        office: { id: 'office-1', name: 'Infrastructure' },
      } as Category;

      const mockOfficer = {
        id: 'officer-1',
        officeId: 'office-1',
        office: { id: 'office-1', name: 'Infrastructure' },
      } as User;

      const reportWithCategory = {
        ...mockReport,
        categoryId: 'cat-1',
        category: mockCategory,
      } as Report;

      const updateDto: UpdateReportDto = {
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 'officer-1',
      };

      reportRepository.findOne.mockResolvedValue(reportWithCategory);
      userRepository.findOne.mockResolvedValue(mockOfficer);
      reportRepository.save.mockImplementation(async (r) => r as Report);

      await service.update('mocked-id', updateDto);

      expect(reportRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedOfficer: mockOfficer,
          assignedOfficerId: 'officer-1',
        }),
      );
    });

    it('should load category separately when not included in report', async () => {
      const mockCategory = {
        id: 'cat-1',
        office: { id: 'office-1', name: 'Infrastructure' },
      } as Category;

      const mockOfficer = {
        id: 'officer-1',
        officeId: 'office-1',
        office: { id: 'office-1', name: 'Infrastructure' },
      } as User;

      const reportWithoutCategory = {
        ...mockReport,
        categoryId: 'cat-1',
        category: null,
      } as Report;

      const updateDto: UpdateReportDto = {
        status: ReportStatus.ASSIGNED,
        assignedOfficerId: 'officer-1',
      };

      reportRepository.findOne.mockResolvedValue(reportWithoutCategory);
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      userRepository.findOne.mockResolvedValue(mockOfficer);
      reportRepository.save.mockImplementation(async (r) => r as Report);

      await service.update('mocked-id', updateDto);

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        relations: ['office'],
      });
      expect(reportRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedOfficer: mockOfficer,
          assignedOfficerId: 'officer-1',
        }),
      );
    });
  });

  describe('findByUserId', () => {
    it('should return reports assigned to a specific officer and sanitize them', async () => {
      const mockReports = [
        { ...mockReport, id: 'r1' },
        { ...mockReport, id: 'r2', isAnonymous: true, user: mockCitizenUser },
      ];

      reportRepository.find.mockResolvedValue(mockReports as Report[]);

      const result = await service.findByUserId(
        'officer-1',
        mockOtherCitizenUser,
      );

      expect(reportRepository.find).toHaveBeenCalledWith({
        where: { assignedOfficerId: 'officer-1' },
        relations: ['user', 'category', 'assignedOfficer'],
        order: { createdAt: 'DESC' },
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('r1');
      expect(result[1].user).toBeNull();
    });
  });

  describe('getDashboardStats', () => {
    it('should return aggregated stats correctly mapping raw results', async () => {
      const mockRawStats = {
        total: '100',
        pending: '10',
        in_progress: '20',
        resolved: '30',
        assigned_global: '20',
        rejected_global: '20',
        user_assigned: '5',
        user_rejected: '2',
        user_in_progress: '3',
        user_resolved: '15',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockRawStats),
      };

      reportRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getDashboardStats(mockCitizenUser);

      expect(reportRepository.createQueryBuilder).toHaveBeenCalledWith(
        'report',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'COUNT(report.id)',
        'total',
      );
      expect(mockQueryBuilder.setParameters).toHaveBeenCalledWith({
        userId: mockCitizenUser.id,
      });

      expect(result).toEqual({
        total: 100,
        pending: 10,
        in_progress: 20,
        resolved: 30,
        assigned: 20,
        rejected: 20,
        user_assigned: 5,
        user_rejected: 2,
        user_in_progress: 3,
        user_resolved: 15,
      });
    });

    it('should return zeros if database returns nulls', async () => {
      const mockRawStats = {};

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockRawStats),
      };

      reportRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getDashboardStats(mockCitizenUser);

      expect(result).toEqual({
        total: 0,
        pending: 0,
        in_progress: 0,
        resolved: 0,
        assigned: 0,
        rejected: 0,
        user_assigned: 0,
        user_rejected: 0,
        user_in_progress: 0,
        user_resolved: 0,
      });
    });
  });
});
