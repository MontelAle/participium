import { Role } from '@entities';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  let service: RolesService;
  let roleRepository: jest.Mocked<Repository<Role>>;

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<Repository<Role>>> = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    roleRepository = module.get(getRepositoryToken(Role));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of roles excluding "user" role', async () => {
      const mockRoles: Role[] = [
        { id: '1', name: 'admin' } as Role,
        { id: '2', name: 'admin' } as Role,
      ];
      roleRepository.find.mockResolvedValue(mockRoles);

      const result = await service.findAll();

      expect(result).toEqual(mockRoles);
      expect(roleRepository.find).toHaveBeenCalledWith({
        where: {
          name: expect.any(Object),
        },
      });
      expect(roleRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array if no roles exist (excluding "user")', async () => {
      roleRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(roleRepository.find).toHaveBeenCalledTimes(1);
    });
  });
});
