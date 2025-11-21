import { Test, TestingModule } from '@nestjs/testing';
import { OfficesController } from './offices.controller';
import { OfficesService } from './offices.service';
import { SessionGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('OfficesController', () => {
  let controller: OfficesController;
  let service: OfficesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OfficesController],
      providers: [
        {
          provide: OfficesService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([
              { id: '1', name: 'office1', label: 'Office 1' },
              { id: '2', name: 'office2', label: 'Office 2' },
            ]),
          },
        },
      ],
    })
      .overrideGuard(SessionGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<OfficesController>(OfficesController);
    service = module.get<OfficesService>(OfficesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all offices', async () => {
    const result = await controller.findAll();
    expect(result).toEqual({
      success: true,
      data: [
        { id: '1', name: 'office1', label: 'Office 1' },
        { id: '2', name: 'office2', label: 'Office 2' },
      ],
    });
    expect(service.findAll).toHaveBeenCalled();
  });
});
