import { Report, ReportStatus } from '@entities';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { REPORT_ERROR_MESSAGES } from './constants/error-messages';
import {
  CreateReportDto,
  FilterReportsDto,
  UpdateReportDto,
} from './dto/reports.dto';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

jest.mock('nanoid', () => ({ nanoid: () => 'mocked-id' }));

const mockSessionGuard = { canActivate: jest.fn(() => true) };
const mockRolesGuard = { canActivate: jest.fn(() => true) };

describe('ReportsController', () => {
  let controller: ReportsController;
  let reportsService: jest.Mocked<ReportsService>;

  const mockUser = { id: 'user-123', role: { name: 'user' } };
  const mockReq = { user: mockUser } as any;

  const mockReport: Partial<Report> = {
    id: 'report-123',
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
    isAnonymous: false,
  };

  const mockStats = {
    total: 10,
    pending: 2,
    in_progress: 3,
    resolved: 4,
    assigned: 1,
    rejected: 0,
    user_assigned: 1,
    user_rejected: 0,
    user_in_progress: 0,
    user_resolved: 0,
  };

  beforeEach(async () => {
    const mockReportsService: Partial<jest.Mocked<ReportsService>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllPublic: jest.fn(),
      findOne: jest.fn(),
      findNearby: jest.fn(),
      update: jest.fn(),
      findByUserId: jest.fn(),
      getDashboardStats: jest.fn(),
      getCommentsForReport: jest.fn(),
      getMessagesForReport: jest.fn(),
      addCommentToReport: jest.fn(),
      addMessageToReport: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: mockReportsService }],
    })
      .overrideGuard(require('../auth/guards/session-auth.guard').SessionGuard)
      .useValue(mockSessionGuard)
      .overrideGuard(require('../auth/guards/roles.guard').RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<ReportsController>(ReportsController);
    reportsService = module.get(ReportsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a report and return success response', async () => {
      const createDto: CreateReportDto = {
        title: 'New Report',
        description: 'New Description',
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
          size: 1024,
        },
      ] as Express.Multer.File[];

      const mockReq = {
        user: { id: 'user-123' },
      } as any;

      reportsService.create.mockResolvedValue(mockReport as Report);

      const result = await controller.create(createDto, mockFiles, mockReq);

      expect(reportsService.create).toHaveBeenCalledWith(
        createDto,
        'user-123',
        mockFiles,
      );
      expect(result).toEqual({ success: true, data: mockReport });
    });

    it('should create a report with 3 images (maximum allowed)', async () => {
      const createDto: CreateReportDto = {
        title: 'Report with max images',
        description: 'Test Description',
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
          size: 1024,
        },
        {
          originalname: 'test2.jpg',
          buffer: Buffer.from('test2'),
          mimetype: 'image/jpeg',
          size: 1024,
        },
        {
          originalname: 'test3.jpg',
          buffer: Buffer.from('test3'),
          mimetype: 'image/jpeg',
          size: 1024,
        },
      ] as Express.Multer.File[];

      const mockReq = { user: { id: 'user-123' } } as any;

      reportsService.create.mockResolvedValue(mockReport as Report);

      const result = await controller.create(createDto, mockFiles, mockReq);

      expect(reportsService.create).toHaveBeenCalledWith(
        createDto,
        'user-123',
        mockFiles,
      );
      expect(result).toEqual({ success: true, data: mockReport });
    });

    it('should throw BadRequestException if no images provided', async () => {
      const createDto: CreateReportDto = {
        title: 'Test Report',
        description: 'Test Description',
        longitude: 7.686864,
        latitude: 45.070312,
        categoryId: 'cat-123',
        isAnonymous: false,
      };

      const mockReq = { user: { id: 'user-123' } } as any;

      await expect(controller.create(createDto, [], mockReq)).rejects.toThrow(
        REPORT_ERROR_MESSAGES.IMAGES_REQUIRED,
      );
    });

    it('should throw BadRequestException if more than 3 images provided', async () => {
      const createDto: CreateReportDto = {
        title: 'Test Report',
        description: 'Test Description',
        longitude: 7.686864,
        latitude: 45.070312,
        categoryId: 'cat-123',
        isAnonymous: false,
      };

      const mockFiles = [
        { originalname: 'test1.jpg', mimetype: 'image/jpeg', size: 1024 },
        { originalname: 'test2.jpg', mimetype: 'image/jpeg', size: 1024 },
        { originalname: 'test3.jpg', mimetype: 'image/jpeg', size: 1024 },
        { originalname: 'test4.jpg', mimetype: 'image/jpeg', size: 1024 },
      ] as Express.Multer.File[];

      const mockReq = { user: { id: 'user-123' } } as any;

      await expect(
        controller.create(createDto, mockFiles, mockReq),
      ).rejects.toThrow(REPORT_ERROR_MESSAGES.IMAGES_REQUIRED);
    });

    it('should throw BadRequestException if invalid file type', async () => {
      const createDto: CreateReportDto = {
        title: 'Test Report',
        description: 'Test Description',
        longitude: 7.686864,
        latitude: 45.070312,
        categoryId: 'cat-123',
        isAnonymous: false,
      };

      const mockFiles = [
        {
          originalname: 'test.pdf',
          buffer: Buffer.from('test'),
          mimetype: 'application/pdf',
          size: 1024,
        },
      ] as Express.Multer.File[];

      const mockReq = { user: { id: 'user-123' } } as any;

      await expect(
        controller.create(createDto, mockFiles, mockReq),
      ).rejects.toThrow(
        REPORT_ERROR_MESSAGES.INVALID_FILE_TYPE('application/pdf'),
      );
    });

    it('should throw BadRequestException if file exceeds size limit', async () => {
      const createDto: CreateReportDto = {
        title: 'Test Report',
        description: 'Test Description',
        longitude: 7.686864,
        latitude: 45.070312,
        categoryId: 'cat-123',
        isAnonymous: false,
      };

      const mockFiles = [
        {
          originalname: 'large.jpg',
          buffer: Buffer.from('test'),
          mimetype: 'image/jpeg',
          size: 6 * 1024 * 1024,
        },
      ] as Express.Multer.File[];

      const mockReq = { user: { id: 'user-123' } } as any;

      await expect(
        controller.create(createDto, mockFiles, mockReq),
      ).rejects.toThrow(REPORT_ERROR_MESSAGES.FILE_SIZE_EXCEEDED('large.jpg'));
    });
  });

  describe('findAll', () => {
    it('should return all reports without filters', async () => {
      const mockReports = [mockReport, { ...mockReport, id: 'report-2' }];
      reportsService.findAll.mockResolvedValue(mockReports as Report[]);

      const result = await controller.findAll(mockReq, {});

      expect(reportsService.findAll).toHaveBeenCalledWith(mockUser, {});
      expect(result).toEqual({ success: true, data: mockReports });
    });

    it('should return reports filtered by status', async () => {
      const filters: FilterReportsDto = { status: ReportStatus.PENDING };
      const mockReports = [mockReport];

      reportsService.findAll.mockResolvedValue(mockReports as Report[]);

      const result = await controller.findAll(mockReq, filters);

      expect(reportsService.findAll).toHaveBeenCalledWith(mockUser, filters);
      expect(result).toEqual({ success: true, data: mockReports });
    });

    it('should return reports filtered by categoryId', async () => {
      const filters: FilterReportsDto = { categoryId: 'cat-123' };
      const mockReports = [mockReport];

      reportsService.findAll.mockResolvedValue(mockReports as Report[]);

      const result = await controller.findAll(mockReq, filters);

      expect(reportsService.findAll).toHaveBeenCalledWith(mockUser, filters);
      expect(result).toEqual({ success: true, data: mockReports });
    });

    it('should return reports filtered by userId', async () => {
      const filters: FilterReportsDto = { userId: 'user-123' };
      const mockReports = [mockReport];

      reportsService.findAll.mockResolvedValue(mockReports as Report[]);

      const result = await controller.findAll(mockReq, filters);

      expect(reportsService.findAll).toHaveBeenCalledWith(mockUser, filters);
      expect(result).toEqual({ success: true, data: mockReports });
    });

    it('should return reports filtered by bounding box', async () => {
      const filters: FilterReportsDto = {
        minLongitude: 7.0,
        maxLongitude: 8.0,
        minLatitude: 45.0,
        maxLatitude: 46.0,
      };
      const mockReports = [mockReport];

      reportsService.findAll.mockResolvedValue(mockReports as Report[]);

      const result = await controller.findAll(mockReq, filters);

      expect(reportsService.findAll).toHaveBeenCalledWith(mockUser, filters);
      expect(result).toEqual({ success: true, data: mockReports });
    });

    it('should return reports filtered by radius', async () => {
      const filters: FilterReportsDto = {
        searchLongitude: 7.686864,
        searchLatitude: 45.070312,
        radiusMeters: 5000,
      };
      const mockReports = [mockReport];

      reportsService.findAll.mockResolvedValue(mockReports as Report[]);

      const result = await controller.findAll(mockReq, filters);

      expect(reportsService.findAll).toHaveBeenCalledWith(mockUser, filters);
      expect(result).toEqual({ success: true, data: mockReports });
    });

    it('should return empty array if no reports match filters', async () => {
      const filters: FilterReportsDto = { status: ReportStatus.RESOLVED };

      reportsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockReq, filters);

      expect(reportsService.findAll).toHaveBeenCalledWith(mockUser, filters);
      expect(result).toEqual({ success: true, data: [] });
    });
  });

  describe('findAllPublic', () => {
    it('should return public reports without filters', async () => {
      const mockReports = [mockReport];
      reportsService.findAllPublic.mockResolvedValue(mockReports as Report[]);

      const result = await controller.findAllPublic({});

      expect(reportsService.findAllPublic).toHaveBeenCalledWith({});
      expect(result).toEqual({ success: true, data: mockReports });
    });

    it('should return public reports with filters', async () => {
      const filters: FilterReportsDto = { categoryId: 'cat-123' };
      const mockReports = [mockReport];

      reportsService.findAllPublic.mockResolvedValue(mockReports as Report[]);

      const result = await controller.findAllPublic(filters);

      expect(reportsService.findAllPublic).toHaveBeenCalledWith(filters);
      expect(result).toEqual({ success: true, data: mockReports });
    });
  });

  describe('findNearby', () => {
    it('should return nearby reports with default radius', async () => {
      const mockNearbyReports = [
        { ...mockReport, distance: 150.5 },
        { ...mockReport, id: 'report-2', distance: 825.3 },
      ];

      reportsService.findNearby.mockResolvedValue(mockNearbyReports as any);

      const result = await controller.findNearby(
        mockReq,
        '7.686864',
        '45.070312',
      );

      expect(reportsService.findNearby).toHaveBeenCalledWith(
        7.686864,
        45.070312,
        5000,
        mockUser,
      );
      expect(result).toEqual({ success: true, data: mockNearbyReports });
    });

    it('should return nearby reports with custom radius', async () => {
      const mockNearbyReports = [{ ...mockReport, distance: 150.5 }];

      reportsService.findNearby.mockResolvedValue(mockNearbyReports as any);

      const result = await controller.findNearby(
        mockReq,
        '7.686864',
        '45.070312',
        '1000',
      );

      expect(reportsService.findNearby).toHaveBeenCalledWith(
        7.686864,
        45.070312,
        1000,
        mockUser,
      );
      expect(result).toEqual({ success: true, data: mockNearbyReports });
    });

    it('should return empty array if no reports nearby', async () => {
      reportsService.findNearby.mockResolvedValue([]);

      const result = await controller.findNearby(mockReq, '0', '0', '100');

      expect(reportsService.findNearby).toHaveBeenCalledWith(
        0,
        0,
        100,
        mockUser,
      );
      expect(result).toEqual({ success: true, data: [] });
    });
  });

  describe('findOne', () => {
    it('should return a report by id', async () => {
      reportsService.findOne.mockResolvedValue(mockReport as Report);

      const result = await controller.findOne('report-123', mockReq);

      expect(reportsService.findOne).toHaveBeenCalledWith(
        'report-123',
        mockUser,
      );
      expect(result).toEqual({ success: true, data: mockReport });
    });

    it('should throw NotFoundException if report not found', async () => {
      reportsService.findOne.mockRejectedValue(
        new NotFoundException('Report with ID non-existent not found'),
      );

      await expect(controller.findOne('non-existent', mockReq)).rejects.toThrow(
        NotFoundException,
      );
      expect(reportsService.findOne).toHaveBeenCalledWith(
        'non-existent',
        mockUser,
      );
    });
  });

  describe('update', () => {
    it('should update a report and return success response', async () => {
      const updateDto: UpdateReportDto = {
        title: 'Updated Title',
        status: ReportStatus.IN_PROGRESS,
      };

      const updatedReport = { ...mockReport, ...updateDto };
      reportsService.update.mockResolvedValue(updatedReport as Report);

      const result = await controller.update('report-123', updateDto, mockReq);

      expect(reportsService.update).toHaveBeenCalledWith(
        'report-123',
        updateDto,
        mockUser,
      );
      expect(result).toEqual({ success: true, data: updatedReport });
    });

    it('should update location fields', async () => {
      const updateDto: UpdateReportDto = {
        longitude: 8.0,
        latitude: 46.0,
        address: 'New Address',
      };

      const updatedReport: Partial<Report> = {
        ...mockReport,
        location: {
          type: 'Point',
          coordinates: [8.0, 46.0],
        },
        address: 'New Address',
      };
      reportsService.update.mockResolvedValue(updatedReport as Report);

      const result = await controller.update('report-123', updateDto, mockReq);

      expect(reportsService.update).toHaveBeenCalledWith(
        'report-123',
        updateDto,
        mockUser,
      );
      expect(result).toEqual({ success: true, data: updatedReport });
    });

    it('should throw NotFoundException if report not found', async () => {
      const updateDto: UpdateReportDto = { status: ReportStatus.RESOLVED };

      reportsService.update.mockRejectedValue(
        new NotFoundException('Report with ID non-existent not found'),
      );

      await expect(
        controller.update('non-existent', updateDto, mockReq),
      ).rejects.toThrow(NotFoundException);

      expect(reportsService.update).toHaveBeenCalledWith(
        'non-existent',
        updateDto,
        mockUser,
      );
    });
  });

  describe('findByUserId', () => {
    it('should return reports assigned to a specific user', async () => {
      const mockReports = [mockReport];
      reportsService.findByUserId.mockResolvedValue(mockReports as Report[]);

      const result = await controller.findByUserId('officer-123', mockReq);

      expect(reportsService.findByUserId).toHaveBeenCalledWith(
        'officer-123',
        mockUser,
      );
      expect(result).toEqual({ success: true, data: mockReports });
    });
  });

  describe('getStats', () => {
    it('should return dashboard stats', async () => {
      reportsService.getDashboardStats.mockResolvedValue(mockStats);

      const result = await controller.getStats(mockReq);

      expect(reportsService.getDashboardStats).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({ success: true, data: mockStats });
    });
  });

  describe('getCommentsForReport', () => {
    it('should return comments for a report', async () => {
      const mockComments = [
        {
          id: 'c1',
          content: 'First',
          reportId: 'report-123',
          user: mockUser,
          createdAt: new Date('2023-01-01'),
        },
        {
          id: 'c2',
          content: 'Second',
          reportId: 'report-123',
          user: mockUser,
          createdAt: new Date('2023-01-02'),
        },
      ];
      reportsService.getCommentsForReport.mockResolvedValue(
        mockComments as any,
      );

      const result = await controller.getComments('report-123', mockReq);

      expect(reportsService.getCommentsForReport).toHaveBeenCalledWith(
        'report-123',
        mockUser,
      );
      expect(result).toEqual({ success: true, data: mockComments });
    });
  });

  describe('getMessagesForReport', () => {
    it('should return messages for a report', async () => {
      const mockMessages = [
        {
          id: 'm1',
          content: 'Hello',
          reportId: 'report-123',
          user: mockUser,
          createdAt: new Date('2023-01-01'),
        },
        {
          id: 'm2',
          content: 'Reply',
          reportId: 'report-123',
          user: mockUser,
          createdAt: new Date('2023-01-02'),
        },
      ];
      reportsService.getMessagesForReport.mockResolvedValue(
        mockMessages as any,
      );

      const result = await controller.getMessages('report-123', mockReq);

      expect(reportsService.getMessagesForReport).toHaveBeenCalledWith(
        'report-123',
        mockUser,
      );
      expect(result).toEqual({ success: true, data: mockMessages });
    });
  });

  describe('addMessageToReport', () => {
    it('should add a message to a report', async () => {
      const createMessageDto = { content: 'A new message' } as any;
      const mockMessage = {
        id: 'm3',
        ...createMessageDto,
        reportId: 'report-123',
        userId: 'user-123',
      } as any;
      reportsService.addMessageToReport.mockResolvedValue(mockMessage as any);

      const result = await controller.addMessage(
        'report-123',
        createMessageDto,
        mockReq,
      );

      expect(reportsService.addMessageToReport).toHaveBeenCalledWith(
        'report-123',
        'user-123',
        createMessageDto,
      );
      expect(result).toEqual({ success: true, data: mockMessage });
    });
  });

  describe('addCommentToReport', () => {
    it('should add a comment to a report', async () => {
      const createCommentDto = { content: 'A new comment' };
      const mockComment = {
        id: 'c1',
        ...createCommentDto,
        reportId: 'report-123',
        userId: 'user-123',
      };
      reportsService.addCommentToReport.mockResolvedValue(mockComment as any);

      const result = await controller.addComment(
        'report-123',
        createCommentDto,
        mockReq,
      );

      expect(reportsService.addCommentToReport).toHaveBeenCalledWith(
        'report-123',
        'user-123',
        createCommentDto,
      );
      expect(result).toEqual({ success: true, data: mockComment });
    });
  });
});
