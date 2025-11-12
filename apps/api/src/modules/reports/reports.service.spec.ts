import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Report, CreateReportDto, UpdateReportDto, FilterReportsDto, ReportStatus } from '@repo/api';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

// Mock nanoid per avere id prevedibili
jest.mock('nanoid', () => ({ nanoid: () => 'mocked-id' }));

describe('ReportsService', () => {
  let service: ReportsService;
  let reportRepository: jest.Mocked<Repository<Report>>;

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
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    reportRepository = module.get(getRepositoryToken(Report));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a report with all fields', async () => {
      const createDto: CreateReportDto = {
        title: 'New Report',
        description: 'New Description',
        longitude: 7.686864,
        latitude: 45.070312,
        address: 'Via Roma 1, Torino',
        images: ['image1.jpg'],
        categoryId: 'cat-123',
      };

      const expectedReport = {
        id: 'mocked-id',
        ...createDto,
        location: {
          type: 'Point',
          coordinates: [7.686864, 45.070312],
        },
        status: ReportStatus.PENDING,
        userId: 'user-123',
      };

      reportRepository.create.mockReturnValue(expectedReport as unknown as Report);
      reportRepository.save.mockResolvedValue(expectedReport as unknown as Report);

      const result = await service.create(createDto, 'user-123');

      expect(reportRepository.create).toHaveBeenCalledWith({
        id: 'mocked-id',
        title: createDto.title,
        description: createDto.description,
        address: createDto.address,
        images: createDto.images,
        categoryId: createDto.categoryId,
        location: {
          type: 'Point',
          coordinates: [7.686864, 45.070312],
        },
        userId: 'user-123',
      });
      expect(reportRepository.save).toHaveBeenCalledWith(expectedReport);
      expect(result).toEqual(expectedReport);
    });

    it('should create a report with only required fields (longitude, latitude)', async () => {
      const createDto: CreateReportDto = {
        longitude: 7.686864,
        latitude: 45.070312,
      };

      const expectedReport = {
        id: 'mocked-id',
        location: {
          type: 'Point',
          coordinates: [7.686864, 45.070312],
        },
        status: ReportStatus.PENDING,
        userId: 'user-123',
      };

      reportRepository.create.mockReturnValue(expectedReport as unknown as Report);
      reportRepository.save.mockResolvedValue(expectedReport as unknown as Report);

      const result = await service.create(createDto, 'user-123');

      expect(reportRepository.create).toHaveBeenCalledWith({
        id: 'mocked-id',
        location: {
          type: 'Point',
          coordinates: [7.686864, 45.070312],
        },
        userId: 'user-123',
      });
      expect(result).toEqual(expectedReport);
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

      reportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll();

      expect(reportRepository.createQueryBuilder).toHaveBeenCalledWith('report');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('report.user', 'user');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('report.category', 'category');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('report.createdAt', 'DESC');
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

      reportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(filters);

      expect(reportRepository.createQueryBuilder).toHaveBeenCalledWith('report');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('report.status = :status', {
        status: ReportStatus.PENDING,
      });
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

      reportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('report.categoryId = :categoryId', {
        categoryId: 'cat-123',
      });
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

      reportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('report.userId = :userId', {
        userId: 'user-123',
      });
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

      reportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

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

      reportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

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

      reportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('report.status = :status', {
        status: ReportStatus.PENDING,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('report.categoryId = :categoryId', {
        categoryId: 'cat-123',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('report.userId = :userId', {
        userId: 'user-123',
      });
      expect(result).toEqual(mockReports);
    });
  });

  describe('findOne', () => {
    it('should return a report by id', async () => {
      reportRepository.findOne.mockResolvedValue(mockReport as unknown as Report);

      const result = await service.findOne('mocked-id');

      expect(reportRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'mocked-id' },
        relations: ['user', 'category'],
      });
      expect(result).toEqual(mockReport);
    });

    it('should throw NotFoundException if report not found', async () => {
      reportRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Report with ID non-existent-id not found',
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

      reportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findNearby(7.686864, 45.070312, 5000);

      expect(reportRepository.createQueryBuilder).toHaveBeenCalledWith('report');
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

      reportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

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

      reportRepository.findOne.mockResolvedValue(mockReport as unknown as Report);
      reportRepository.save.mockResolvedValue(updatedReport as unknown as Report);

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

      await expect(service.update('non-existent-id', {})).rejects.toThrow(NotFoundException);
      await expect(service.update('non-existent-id', {})).rejects.toThrow(
        'Report with ID non-existent-id not found',
      );
    });
  });

  describe('remove', () => {
    it('should delete a report', async () => {
      reportRepository.findOne.mockResolvedValue(mockReport as unknown as Report);
      reportRepository.remove.mockResolvedValue(mockReport as unknown as Report);

      await service.remove('mocked-id');

      expect(reportRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'mocked-id' },
        relations: ['user', 'category'],
      });
      expect(reportRepository.remove).toHaveBeenCalledWith(mockReport);
    });

    it('should throw NotFoundException if report not found', async () => {
      reportRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.remove('non-existent-id')).rejects.toThrow(
        'Report with ID non-existent-id not found',
      );
    });
  });
});
