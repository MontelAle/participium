import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { SessionGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('RolesController', () => {
  let controller: RolesController;
  let rolesService: Partial<{ findAll: jest.Mock }>;

  beforeEach(async () => {
    rolesService = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        { provide: RolesService, useValue: rolesService },
      ],
    })
      // Mock guards to bypass authentication/authorization for controller tests
      .overrideGuard(SessionGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<RolesController>(RolesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return a list of roles wrapped in success object', async () => {
      const mockRoles = [
        { id: '1', name: 'admin' },
        { id: '2', name: 'user' },
      ];
      rolesService.findAll.mockResolvedValue(mockRoles);

      const result = await controller.findAll();

      expect(rolesService.findAll).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: mockRoles });
    });
  });
});
