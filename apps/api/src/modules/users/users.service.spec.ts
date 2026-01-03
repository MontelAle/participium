import { Account, Category, Office, Profile, Report, Role, User, UserOfficeRole } from '@entities';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MinioProvider } from '../../providers/minio/minio.provider';
import { ReportsService } from '../reports/reports.service';
import { USER_ERROR_MESSAGES } from './constants/error-messages';
import { CreateMunicipalityUserDto } from './dto/municipality-users.dto';
import { UsersService } from './users.service';

jest.mock('nanoid', () => ({ nanoid: () => 'mocked-id' }));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let module: TestingModule;
  let userRepository: jest.Mocked<Repository<User>>;
  let accountRepository: jest.Mocked<Repository<Account>>;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let officeRepository: jest.Mocked<Repository<Office>>;
  let profileRepository: jest.Mocked<Repository<Profile>>;
  let userOfficeRoleRepository: jest.Mocked<Repository<UserOfficeRole>>;
  let reportRepository: jest.Mocked<Repository<Report>>;
  let reportsService: jest.Mocked<ReportsService>;
  const mockManager = {
    getRepository: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@test.com',
    role: { isMunicipal: true },
  } as User;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            manager: {
              transaction: jest.fn((cb) => cb(mockManager)),
            },
          },
        },
        {
          provide: getRepositoryToken(Account),
          useValue: {
            save: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Office),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: MinioProvider,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
            extractFileNameFromUrl: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Profile),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserOfficeRole),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Report),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue({
              innerJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            }),
            save: jest.fn(),
          },
        },
        {
          provide: ReportsService,
          useValue: {
            findOfficerWithFewestReports: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    accountRepository = module.get(getRepositoryToken(Account));
    roleRepository = module.get(getRepositoryToken(Role));
    officeRepository = module.get(getRepositoryToken(Office));
    profileRepository = module.get(getRepositoryToken(Profile)); // <-- Add this line
    userOfficeRoleRepository = module.get(getRepositoryToken(UserOfficeRole));
    reportRepository = module.get(getRepositoryToken(Report));
    reportsService = module.get(ReportsService);

    mockManager.getRepository.mockImplementation((entity) => {
      if (entity === User) return userRepository;
      if (entity === Account) return accountRepository;
      if (entity === Role) return roleRepository;
      if (entity === Office) return officeRepository;
      if (entity === Profile) return profileRepository;
      if (entity === UserOfficeRole) return userOfficeRoleRepository;
      return null;
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findMunicipalityUsers', () => {
    it('should return users with municipal role', async () => {
      const users = [mockUser];
      userRepository.find.mockResolvedValue(users);

      const result = await service.findMunicipalityUsers();

      expect(userRepository.find).toHaveBeenCalledWith({
        relations: ['role', 'office'],
        where: { role: { isMunicipal: true } },
        order: { firstName: 'ASC', lastName: 'ASC' },
      });
      expect(result).toEqual(users);
    });
  });

  describe('findMunicipalityUserById', () => {
    it('should return a user if found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findMunicipalityUserById('user-1');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findMunicipalityUserById('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createMunicipalityUser', () => {
    const createDto: CreateMunicipalityUserDto = {
      email: 'new@test.com',
      username: 'newuser',
      firstName: 'New',
      lastName: 'User',
      password: 'password',
      roleId: 'role-1',
      officeId: 'office-1',
    };

    it('should successfully create a user and account in transaction', async () => {
      roleRepository.findOne.mockResolvedValue({ id: 'role-1' } as Role);
      officeRepository.findOne.mockResolvedValue({ id: 'office-1' } as Office);
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      profileRepository.create.mockReturnValue({} as Profile); // Mock profile creation
      profileRepository.save.mockResolvedValue({} as Profile); // Mock profile save

      const createdUser = { ...mockUser, id: 'new-id' };
      userRepository.create.mockReturnValue(createdUser);
      userRepository.save.mockResolvedValue(createdUser);
      accountRepository.create.mockReturnValue({} as Account);

      const result = await service.createMunicipalityUser(createDto);

      expect(userRepository.save).toHaveBeenCalled();
      expect(accountRepository.save).toHaveBeenCalled();
      expect(result).toEqual(createdUser);
    });

    it('should throw NotFoundException if role not found', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(service.createMunicipalityUser(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if username exists', async () => {
      roleRepository.findOne.mockResolvedValue({ id: 'role-1' } as Role);
      officeRepository.findOne.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.createMunicipalityUser(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if email exists', async () => {
      roleRepository.findOne.mockResolvedValue({ id: 'role-1' } as Role);
      officeRepository.findOne.mockResolvedValue(null);
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser);

      await expect(service.createMunicipalityUser(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should not validate office-role match when role is null', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(service.createMunicipalityUser(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when using roleId without officeId', async () => {
      const dtoWithoutOfficeId: CreateMunicipalityUserDto = {
        ...createDto,
        roleId: 'role-1',
        officeId: undefined,
      };
      delete dtoWithoutOfficeId.officeRoleAssignments;

      // Mock role as a regular role (not external_maintainer)
      roleRepository.findOne.mockResolvedValue({
        id: 'role-1',
        name: 'tech_officer',
      } as Role);

      await expect(
        service.createMunicipalityUser(dtoWithoutOfficeId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createMunicipalityUser(dtoWithoutOfficeId),
      ).rejects.toThrow('officeId is required when using roleId');
    });

    it('should throw BadRequestException when external_maintainer has no office', async () => {
      const externalMaintainerDto: CreateMunicipalityUserDto = {
        ...createDto,
        roleId: 'ext-role',
        officeId: undefined,
      };

      roleRepository.findOne.mockResolvedValue({
        id: 'ext-role',
        name: 'external_maintainer',
      } as Role);
      officeRepository.findOne.mockResolvedValue(null);
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(
        service.createMunicipalityUser(externalMaintainerDto),
      ).rejects.toThrow(
        new BadRequestException(
          USER_ERROR_MESSAGES.EXTERNAL_MAINTAINER_NO_OFFICE,
        ),
      );
    });

    it('should throw BadRequestException when external_maintainer assigned to non-external office', async () => {
      const externalMaintainerDto = {
        ...createDto,
        roleId: 'ext-role',
        officeId: 'internal-office',
      };

      roleRepository.findOne.mockResolvedValue({
        id: 'ext-role',
        name: 'external_maintainer',
      } as Role);
      officeRepository.findOne.mockResolvedValue({
        id: 'internal-office',
        isExternal: false,
      } as Office);
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(
        service.createMunicipalityUser(externalMaintainerDto),
      ).rejects.toThrow(
        new BadRequestException(
          USER_ERROR_MESSAGES.EXTERNAL_MAINTAINER_WRONG_OFFICE,
        ),
      );
    });

    it('should throw BadRequestException when non-external_maintainer assigned to external office', async () => {
      const regularUserDto = {
        ...createDto,
        roleId: 'officer-role',
        officeId: 'external-office',
      };

      roleRepository.findOne.mockResolvedValue({
        id: 'officer-role',
        name: 'tech_officer',
      } as Role);
      officeRepository.findOne.mockResolvedValue({
        id: 'external-office',
        isExternal: true,
      } as Office);
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(
        service.createMunicipalityUser(regularUserDto),
      ).rejects.toThrow(
        new BadRequestException(
          USER_ERROR_MESSAGES.REGULAR_USER_EXTERNAL_OFFICE,
        ),
      );
    });

    it('should successfully create external_maintainer with external office', async () => {
      const externalMaintainerDto = {
        ...createDto,
        roleId: 'ext-role',
        officeId: 'external-office',
      };

      roleRepository.findOne.mockResolvedValue({
        id: 'ext-role',
        name: 'external_maintainer',
      } as Role);
      officeRepository.findOne.mockResolvedValue({
        id: 'external-office',
        isExternal: true,
      } as Office);
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      profileRepository.create.mockReturnValue({} as Profile); // Mock profile creation
      profileRepository.save.mockResolvedValue({} as Profile); // Mock profile save

      const createdUser = { ...mockUser, id: 'new-ext-maint' };
      userRepository.create.mockReturnValue(createdUser);
      userRepository.save.mockResolvedValue(createdUser);
      accountRepository.create.mockReturnValue({} as Account);

      const result = await service.createMunicipalityUser(
        externalMaintainerDto,
      );

      expect(result).toEqual(createdUser);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should successfully create regular user with non-external office', async () => {
      const regularUserDto = {
        ...createDto,
        roleId: 'officer-role',
        officeId: 'internal-office',
      };

      roleRepository.findOne.mockResolvedValue({
        id: 'officer-role',
        name: 'tech_officer',
      } as Role);
      officeRepository.findOne.mockResolvedValue({
        id: 'internal-office',
        isExternal: false,
      } as Office);
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      profileRepository.create.mockReturnValue({} as Profile); // Mock profile creation
      profileRepository.save.mockResolvedValue({} as Profile); // Mock profile save

      const createdUser = { ...mockUser, id: 'new-officer' };
      userRepository.create.mockReturnValue(createdUser);
      userRepository.save.mockResolvedValue(createdUser);
      accountRepository.create.mockReturnValue({} as Account);

      const result = await service.createMunicipalityUser(regularUserDto);

      expect(result).toEqual(createdUser);
      expect(userRepository.save).toHaveBeenCalled();
    });
  });

  describe('deleteMunicipalityUserById', () => {
    it('should delete user and account in transaction', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      await service.deleteMunicipalityUserById('user-1');

      expect(accountRepository.delete).toHaveBeenCalledWith({
        userId: 'user-1',
      });
      expect(profileRepository.delete).toHaveBeenCalledWith({
        userId: 'user-1',
      });
      expect(userRepository.delete).toHaveBeenCalledWith({ id: 'user-1' });
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteMunicipalityUserById('bad-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMunicipalityUserById', () => {
    const updateDto: Partial<CreateMunicipalityUserDto> = {
      username: 'updated',
      email: 'updated@test.com',
      roleId: 'role-2',
      officeId: 'office-2',
      firstName: 'Updated',
    };

    it('should update user fields and account username in transaction', async () => {
      const existingUser = {
        ...mockUser,
        username: 'old',
        email: 'old@test.com',
      } as User;

      userRepository.findOne.mockReset();

      userRepository.findOne
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      roleRepository.findOne.mockResolvedValue({ id: 'role-2' } as Role);
      officeRepository.findOne.mockResolvedValue({ id: 'office-2' } as Office);
      accountRepository.findOne.mockResolvedValue({ id: 'acc-1' } as Account);

      await service.updateMunicipalityUserById('user-1', updateDto);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Updated',
          roleId: 'role-2',
          officeId: 'office-2',
        }),
      );
      expect(accountRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ accountId: 'updated' }),
      );
    });

    it('should throw NotFoundException when office is not found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      officeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateMunicipalityUserById('user-1', {
          officeId: 'bad-office',
        }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateMunicipalityUserById('user-1', {
          officeId: 'bad-office',
        }),
      ).rejects.toThrow(USER_ERROR_MESSAGES.OFFICE_NOT_FOUND);
    });

    it('should update user without changing username or email', async () => {
      const existingUser = {
        ...mockUser,
        username: 'sameuser',
        email: 'same@test.com',
      } as User;

      userRepository.findOne.mockResolvedValue(existingUser);
      roleRepository.findOne.mockResolvedValue({ id: 'role-2' } as Role);
      officeRepository.findOne.mockResolvedValue({ id: 'office-2' } as Office);

      await service.updateMunicipalityUserById('user-1', {
        firstName: 'NewName',
        roleId: 'role-2',
        officeId: 'office-2',
      });

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'NewName',
        }),
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(
        service.updateMunicipalityUserById('bad', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new username taken', async () => {
      const existingUser = { ...mockUser, username: 'old' };
      userRepository.findOne
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ id: 'other' } as User);

      await expect(
        service.updateMunicipalityUserById('user-1', { username: 'taken' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if new email taken', async () => {
      const existingUser = { ...mockUser, email: 'old@test.com' };
      userRepository.findOne
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ id: 'other' } as User);

      await expect(
        service.updateMunicipalityUserById('user-1', {
          email: 'taken@test.com',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if new role not found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateMunicipalityUserById('user-1', { roleId: 'bad-role' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when updating to external_maintainer without office', async () => {
      const existingUser = {
        ...mockUser,
        role: {
          id: 'old-role',
          name: 'tech_officer',
          label: 'Tech Officer',
          isMunicipal: true,
        },
      };
      const externalMaintainerRole = {
        id: 'ext-role',
        name: 'external_maintainer',
        label: 'External Maintainer',
        isMunicipal: true,
      };

      userRepository.findOne.mockResolvedValue(existingUser);
      roleRepository.findOne.mockResolvedValue(externalMaintainerRole);

      await expect(
        service.updateMunicipalityUserById('user-1', {
          roleId: 'ext-role',
          officeId: null,
        }),
      ).rejects.toThrow(
        new BadRequestException(
          USER_ERROR_MESSAGES.EXTERNAL_MAINTAINER_NO_OFFICE,
        ),
      );
    });

    it('should throw BadRequestException when updating to external_maintainer with non-external office', async () => {
      const existingUser = {
        ...mockUser,
        role: {
          id: 'old-role',
          name: 'tech_officer',
          label: 'Tech Officer',
          isMunicipal: true,
        },
      };
      const externalMaintainerRole = {
        id: 'ext-role',
        name: 'external_maintainer',
        label: 'External Maintainer',
        isMunicipal: true,
      };
      const internalOffice = {
        id: 'office-1',
        name: 'Internal Office',
        label: 'Internal Office',
        isExternal: false,
        categories: [] as Category[],
      };

      userRepository.findOne.mockResolvedValue(existingUser);
      roleRepository.findOne.mockResolvedValue(externalMaintainerRole);
      officeRepository.findOne.mockResolvedValue(internalOffice);

      await expect(
        service.updateMunicipalityUserById('user-1', {
          roleId: 'ext-role',
          officeId: 'office-1',
        }),
      ).rejects.toThrow(
        new BadRequestException(
          USER_ERROR_MESSAGES.EXTERNAL_MAINTAINER_WRONG_OFFICE,
        ),
      );
    });

    it('should throw BadRequestException when updating regular role to external office', async () => {
      const existingUser = {
        ...mockUser,
        role: {
          id: 'officer-role',
          name: 'tech_officer',
          label: 'Tech Officer',
          isMunicipal: true,
        },
      };
      const regularRole = {
        id: 'officer-role',
        name: 'tech_officer',
        label: 'Tech Officer',
        isMunicipal: true,
      };
      const externalOffice = {
        id: 'ext-office',
        name: 'External Company',
        isExternal: true,
        label: 'External Company',
        categories: [] as Category[],
      };

      userRepository.findOne.mockResolvedValue(existingUser);
      roleRepository.findOne.mockResolvedValue(regularRole);
      officeRepository.findOne.mockResolvedValue(externalOffice);

      await expect(
        service.updateMunicipalityUserById('user-1', {
          roleId: 'officer-role',
          officeId: 'ext-office',
        }),
      ).rejects.toThrow(
        new BadRequestException(
          USER_ERROR_MESSAGES.REGULAR_USER_EXTERNAL_OFFICE,
        ),
      );
    });

    it('should successfully update user to external_maintainer with external office', async () => {
      const existingUser = {
        ...mockUser,
        role: {
          id: 'old-role',
          name: 'tech_officer',
          label: 'Tech Officer',
          isMunicipal: true,
        },
        office: {
          id: 'old-office',
          name: 'Old Office',
          isExternal: false,
          label: 'Old Office',
          categories: [] as Category[],
        },
      };
      const externalMaintainerRole = {
        id: 'ext-role',
        name: 'external_maintainer',
        label: 'External Maintainer',
        isMunicipal: true,
      };
      const externalOffice = {
        id: 'ext-office',
        name: 'External Company',
        isExternal: true,
        label: 'External Company',
        categories: [] as Category[],
      };

      userRepository.findOne.mockResolvedValue(existingUser);
      roleRepository.findOne.mockResolvedValue(externalMaintainerRole);
      officeRepository.findOne.mockResolvedValue(externalOffice);

      await service.updateMunicipalityUserById('user-1', {
        roleId: 'ext-role',
        officeId: 'ext-office',
      });

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          roleId: 'ext-role',
          officeId: 'ext-office',
        }),
      );
    });
  });

  describe('findExternalMaintainers', () => {
    it('should return all external maintainers when no categoryId provided', async () => {
      const mockMaintainers = [
        {
          id: 'maint-1',
          username: 'maint1',
          role: { name: 'external_maintainer' },
          office: { id: 'ext-office-1', isExternal: true },
        },
        {
          id: 'maint-2',
          username: 'maint2',
          role: { name: 'external_maintainer' },
          office: { id: 'ext-office-1', isExternal: true },
        },
      ];

      userRepository.find.mockResolvedValue(mockMaintainers as User[]);

      const result = await service.findExternalMaintainers();

      expect(result).toEqual(mockMaintainers);
      expect(userRepository.find).toHaveBeenCalledWith({
        where: { role: { name: 'external_maintainer' } },
        relations: ['role', 'office'],
        order: { firstName: 'ASC', lastName: 'ASC' },
      });
    });

    it('should return empty array when no external maintainers exist', async () => {
      userRepository.find.mockResolvedValue([]);

      const result = await service.findExternalMaintainers();

      expect(result).toEqual([]);
    });

    it('should return maintainers for specific category external office', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Category 1',
        externalOffice: { id: 'ext-office-1', isExternal: true },
      };
      const mockMaintainers = [
        {
          id: 'maint-1',
          username: 'maint1',
          officeId: 'ext-office-1',
          role: { name: 'external_maintainer' },
          office: mockCategory.externalOffice,
        },
      ];

      const categoryRepository = module.get(getRepositoryToken(Category));
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      userRepository.find.mockResolvedValue(mockMaintainers as User[]);

      const result = await service.findExternalMaintainers('cat-1');

      expect(result).toEqual(mockMaintainers);
      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        relations: ['externalOffice'],
      });
      expect(userRepository.find).toHaveBeenCalledWith({
        where: {
          role: { name: 'external_maintainer' },
          officeId: 'ext-office-1',
        },
        relations: ['role', 'office'],
        order: { firstName: 'ASC', lastName: 'ASC' },
      });
    });

    it('should throw NotFoundException when category not found', async () => {
      const categoryRepository = module.get(getRepositoryToken(Category));
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findExternalMaintainers('invalid-cat'),
      ).rejects.toThrow(
        new NotFoundException(
          USER_ERROR_MESSAGES.CATEGORY_NOT_FOUND('invalid-cat'),
        ),
      );
    });

    it('should throw BadRequestException when category has no external office', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Category 1',
        externalOffice: null as string,
      };

      const categoryRepository = module.get(getRepositoryToken(Category));
      categoryRepository.findOne.mockResolvedValue(mockCategory);

      await expect(service.findExternalMaintainers('cat-1')).rejects.toThrow(
        new BadRequestException(
          USER_ERROR_MESSAGES.CATEGORY_NO_EXTERNAL_OFFICE('cat-1'),
        ),
      );
    });

    it('should throw NotFoundException when no maintainers found for category', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Category 1',
        externalOffice: { id: 'ext-office-1', isExternal: true },
      };

      const categoryRepository = module.get(getRepositoryToken(Category));
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      userRepository.find.mockResolvedValue([]);

      await expect(service.findExternalMaintainers('cat-1')).rejects.toThrow(
        new NotFoundException(
          USER_ERROR_MESSAGES.NO_EXTERNAL_MAINTAINERS_FOR_CATEGORY('cat-1'),
        ),
      );
    });
  });

  describe('findMunicipalityUsers with categoryId filter', () => {
    it('should return municipality users for specific category office', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Category 1',
        office: { id: 'office-1', isExternal: false },
      };
      const mockUsers = [
        {
          id: 'tech-1',
          username: 'tech1',
          officeId: 'office-1',
          role: { name: 'tech_officer', isMunicipal: true },
          office: mockCategory.office,
        },
      ];

      const categoryRepository = module.get(getRepositoryToken(Category));
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      userRepository.find.mockResolvedValue(mockUsers as User[]);

      const result = await service.findMunicipalityUsers('cat-1');

      expect(result).toEqual(mockUsers);
      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        relations: ['office'],
      });
      expect(userRepository.find).toHaveBeenCalledWith({
        where: {
          role: { isMunicipal: true },
          officeId: 'office-1',
        },
        relations: ['role', 'office'],
        order: { firstName: 'ASC', lastName: 'ASC' },
      });
    });

    it('should throw NotFoundException when category not found for filter', async () => {
      const categoryRepository = module.get(getRepositoryToken(Category));
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findMunicipalityUsers('invalid-cat'),
      ).rejects.toThrow(
        new NotFoundException(
          USER_ERROR_MESSAGES.CATEGORY_NOT_FOUND('invalid-cat'),
        ),
      );
    });

    it('should throw BadRequestException when category has no office for filter', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Category 1',
        office: null as Office,
      };

      const categoryRepository = module.get(getRepositoryToken(Category));
      categoryRepository.findOne.mockResolvedValue(mockCategory);

      await expect(service.findMunicipalityUsers('cat-1')).rejects.toThrow(
        new BadRequestException(
          USER_ERROR_MESSAGES.CATEGORY_NO_OFFICE('cat-1'),
        ),
      );
    });

    it('should throw NotFoundException when no users found for category filter', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Category 1',
        office: { id: 'office-1', isExternal: false },
      };

      const categoryRepository = module.get(getRepositoryToken(Category));
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      userRepository.find.mockResolvedValue([]);

      await expect(service.findMunicipalityUsers('cat-1')).rejects.toThrow(
        new NotFoundException(
          USER_ERROR_MESSAGES.NO_OFFICERS_FOR_CATEGORY('cat-1'),
        ),
      );
    });
  });

  describe('getUserOfficeRoles', () => {
    it('should return user office roles with relations', async () => {
      const mockOfficeRoles = [
        {
          id: 'uor-1',
          userId: 'user-1',
          officeId: 'office-1',
          roleId: 'role-1',
          office: { id: 'office-1', name: 'Office A' },
          role: { id: 'role-1', name: 'tech_officer' },
        },
      ] as UserOfficeRole[];

      userOfficeRoleRepository.find.mockResolvedValue(mockOfficeRoles);

      const result = await service.getUserOfficeRoles('user-1');

      expect(userOfficeRoleRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        relations: ['office', 'role'],
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(mockOfficeRoles);
    });
  });

  describe('getUserOffices', () => {
    it('should return unique offices from user assignments', async () => {
      const mockOffice1 = { id: 'office-1', name: 'Office A' } as Office;
      const mockOffice2 = { id: 'office-2', name: 'Office B' } as Office;

      userOfficeRoleRepository.find.mockResolvedValue([
        {
          id: 'uor-1',
          userId: 'user-1',
          officeId: 'office-1',
          office: mockOffice1,
        } as UserOfficeRole,
        {
          id: 'uor-2',
          userId: 'user-1',
          officeId: 'office-2',
          office: mockOffice2,
        } as UserOfficeRole,
      ]);

      const result = await service.getUserOffices('user-1');

      expect(userOfficeRoleRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        relations: ['office'],
      });
      expect(result).toEqual([mockOffice1, mockOffice2]);
    });
  });

  describe('getUserRoles', () => {
    it('should return unique roles from user assignments', async () => {
      const mockRole1 = { id: 'role-1', name: 'tech_officer' } as Role;
      const mockRole2 = { id: 'role-2', name: 'pr_officer' } as Role;

      userOfficeRoleRepository.find.mockResolvedValue([
        {
          id: 'uor-1',
          userId: 'user-1',
          roleId: 'role-1',
          role: mockRole1,
        } as UserOfficeRole,
        {
          id: 'uor-2',
          userId: 'user-1',
          roleId: 'role-2',
          role: mockRole2,
        } as UserOfficeRole,
      ]);

      const result = await service.getUserRoles('user-1');

      expect(result).toEqual([mockRole1, mockRole2]);
    });

    it('should remove duplicate roles when user has same role in multiple offices', async () => {
      const mockRole = { id: 'role-1', name: 'tech_officer' } as Role;

      userOfficeRoleRepository.find.mockResolvedValue([
        {
          id: 'uor-1',
          userId: 'user-1',
          roleId: 'role-1',
          role: mockRole,
        } as UserOfficeRole,
        {
          id: 'uor-2',
          userId: 'user-1',
          roleId: 'role-1',
          role: mockRole,
        } as UserOfficeRole,
      ]);

      const result = await service.getUserRoles('user-1');

      expect(result).toEqual([mockRole]);
      expect(result.length).toBe(1);
    });

    it('should fallback to deprecated role field when no UserOfficeRole assignments', async () => {
      const mockRole = { id: 'role-1', name: 'admin' } as Role;

      userOfficeRoleRepository.find.mockResolvedValue([]);
      userRepository.findOne.mockResolvedValue({
        id: 'user-1',
        role: mockRole,
      } as User);

      const result = await service.getUserRoles('user-1');

      expect(result).toEqual([mockRole]);
    });

    it('should return empty array when no assignments and no deprecated role', async () => {
      userOfficeRoleRepository.find.mockResolvedValue([]);
      userRepository.findOne.mockResolvedValue({
        id: 'user-1',
        role: null,
      } as User);

      const result = await service.getUserRoles('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('assignUserToOffice', () => {
    it('should successfully assign tech_officer to office', async () => {
      const mockRole = { id: 'role-1', name: 'tech_officer' } as Role;
      const mockOffice = { id: 'office-1', isExternal: false } as Office;

      userRepository.findOne.mockResolvedValue({ id: 'user-1' } as User);
      roleRepository.findOne.mockResolvedValue(mockRole);
      officeRepository.findOne.mockResolvedValue(mockOffice);
      userOfficeRoleRepository.findOne.mockResolvedValue(null);
      userOfficeRoleRepository.find.mockResolvedValue([]);
      userOfficeRoleRepository.create.mockReturnValue({
        id: 'mocked-id',
        userId: 'user-1',
        officeId: 'office-1',
        roleId: 'role-1',
      } as UserOfficeRole);
      userOfficeRoleRepository.save.mockResolvedValue({} as UserOfficeRole);

      await service.assignUserToOffice('user-1', 'office-1', 'role-1');

      expect(userOfficeRoleRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if assignment already exists', async () => {
      const mockRole = { id: 'role-1', name: 'tech_officer' } as Role;
      const mockOffice = { id: 'office-1', isExternal: false } as Office;
      const existingAssignment = {
        id: 'existing-uor',
        userId: 'user-1',
        officeId: 'office-1',
        roleId: 'role-1',
      } as UserOfficeRole;

      userRepository.findOne.mockResolvedValue({ id: 'user-1' } as User);
      roleRepository.findOne.mockResolvedValue(mockRole);
      officeRepository.findOne.mockResolvedValue(mockOffice);
      userOfficeRoleRepository.find.mockResolvedValue([]);
      userOfficeRoleRepository.findOne.mockResolvedValue(existingAssignment);

      await expect(
        service.assignUserToOffice('user-1', 'office-1', 'role-1'),
      ).rejects.toThrow(
        new ConflictException(USER_ERROR_MESSAGES.USER_OFFICE_ROLE_ALREADY_EXISTS),
      );
    });

    it('should throw BadRequestException when trying to mix tech_officer and external_maintainer', async () => {
      const mockRole = { id: 'role-2', name: 'external_maintainer' } as Role;
      const mockOffice = { id: 'office-2', isExternal: true } as Office;
      const existingTechOfficer = [
        {
          id: 'uor-1',
          userId: 'user-1',
          roleId: 'role-1',
          role: { id: 'role-1', name: 'tech_officer' },
        },
      ] as UserOfficeRole[];

      userRepository.findOne.mockResolvedValue({ id: 'user-1' } as User);
      roleRepository.findOne.mockResolvedValue(mockRole);
      officeRepository.findOne.mockResolvedValue(mockOffice);
      userOfficeRoleRepository.findOne.mockResolvedValue(null);
      userOfficeRoleRepository.find.mockResolvedValue(existingTechOfficer);

      await expect(
        service.assignUserToOffice('user-1', 'office-2', 'role-2'),
      ).rejects.toThrow(
        new BadRequestException(
          USER_ERROR_MESSAGES.CANNOT_MIX_TECH_OFFICER_AND_EXTERNAL_MAINTAINER,
        ),
      );
    });

    it('should throw BadRequestException when external_maintainer assigned to non-external office', async () => {
      const mockRole = { id: 'role-2', name: 'external_maintainer' } as Role;
      const mockOffice = { id: 'office-1', isExternal: false } as Office;

      userRepository.findOne.mockResolvedValue({ id: 'user-1' } as User);
      roleRepository.findOne.mockResolvedValue(mockRole);
      officeRepository.findOne.mockResolvedValue(mockOffice);
      userOfficeRoleRepository.findOne.mockResolvedValue(null);
      userOfficeRoleRepository.find.mockResolvedValue([]);

      await expect(
        service.assignUserToOffice('user-1', 'office-1', 'role-2'),
      ).rejects.toThrow(
        new BadRequestException(
          USER_ERROR_MESSAGES.EXTERNAL_MAINTAINER_WRONG_OFFICE,
        ),
      );
    });
  });

  describe('removeUserFromOffice', () => {
    it('should successfully remove office assignment', async () => {
      const mockAssignment = {
        id: 'uor-1',
        userId: 'user-1',
        officeId: 'office-1',
      } as UserOfficeRole;

      userOfficeRoleRepository.findOne.mockResolvedValue(mockAssignment);
      userOfficeRoleRepository.count.mockResolvedValue(2);
      userOfficeRoleRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.removeUserFromOffice('user-1', 'office-1');

      expect(userOfficeRoleRepository.delete).toHaveBeenCalledWith({
        id: 'uor-1',
      });
    });

    it('should throw NotFoundException if assignment not found', async () => {
      userOfficeRoleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeUserFromOffice('user-1', 'office-1'),
      ).rejects.toThrow(
        new NotFoundException(USER_ERROR_MESSAGES.USER_OFFICE_ROLE_NOT_FOUND),
      );
    });

    it('should throw BadRequestException when trying to remove last role', async () => {
      const mockAssignment = {
        id: 'uor-1',
        userId: 'user-1',
        officeId: 'office-1',
      } as UserOfficeRole;

      userOfficeRoleRepository.findOne.mockResolvedValue(mockAssignment);
      userOfficeRoleRepository.count.mockResolvedValue(1);

      await expect(
        service.removeUserFromOffice('user-1', 'office-1'),
      ).rejects.toThrow(
        new BadRequestException(USER_ERROR_MESSAGES.MUST_KEEP_AT_LEAST_ONE_ROLE),
      );
    });

    it('should reassign orphan reports to another officer when removing user from office', async () => {
      const mockAssignment = {
        id: 'uor-1',
        userId: 'user-1',
        officeId: 'office-1',
      } as UserOfficeRole;

      const mockOrphanReports = [
        { id: 'report-1', assignedOfficerId: 'user-1', status: 'assigned' } as Report,
        { id: 'report-2', assignedOfficerId: 'user-1', status: 'in_progress' } as Report,
      ];

      const mockNewOfficer = { id: 'user-2', username: 'officer2' } as User;

      userOfficeRoleRepository.findOne.mockResolvedValue(mockAssignment);
      userOfficeRoleRepository.count.mockResolvedValue(2);

      // Mock QueryBuilder for orphan reports
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrphanReports),
      };
      reportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      reportsService.findOfficerWithFewestReports.mockResolvedValue(mockNewOfficer);
      reportRepository.save.mockResolvedValue(mockOrphanReports[0]);

      await service.removeUserFromOffice('user-1', 'office-1');

      // Verify reports were reassigned
      expect(mockOrphanReports[0].assignedOfficerId).toBe('user-2');
      expect(mockOrphanReports[1].assignedOfficerId).toBe('user-2');
      expect(reportRepository.save).toHaveBeenCalledTimes(2);
      expect(reportsService.findOfficerWithFewestReports).toHaveBeenCalledWith('office-1');
    });

    it('should set assignedOfficerId to null when no officers available', async () => {
      const mockAssignment = {
        id: 'uor-1',
        userId: 'user-1',
        officeId: 'office-1',
      } as UserOfficeRole;

      const mockOrphanReports = [
        { id: 'report-1', assignedOfficerId: 'user-1', status: 'assigned' } as Report,
      ];

      userOfficeRoleRepository.findOne.mockResolvedValue(mockAssignment);
      userOfficeRoleRepository.count.mockResolvedValue(2);

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrphanReports),
      };
      reportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // No available officer
      reportsService.findOfficerWithFewestReports.mockResolvedValue(null);

      await service.removeUserFromOffice('user-1', 'office-1');

      // Verify report was set to null (unassigned)
      expect(mockOrphanReports[0].assignedOfficerId).toBe(null);
      expect(reportRepository.save).toHaveBeenCalledWith(mockOrphanReports[0]);
    });

    it('should only reassign reports in assigned/in_progress/suspended states', async () => {
      const mockAssignment = {
        id: 'uor-1',
        userId: 'user-1',
        officeId: 'office-1',
      } as UserOfficeRole;

      userOfficeRoleRepository.findOne.mockResolvedValue(mockAssignment);
      userOfficeRoleRepository.count.mockResolvedValue(2);

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      reportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.removeUserFromOffice('user-1', 'office-1');

      // Verify query was called with correct statuses
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'report.status IN (:...statuses)',
        { statuses: ['assigned', 'in_progress', 'suspended'] },
      );
    });
  });

  describe('userHasOfficeAccess', () => {
    it('should return true if user has access to office', async () => {
      userOfficeRoleRepository.count.mockResolvedValue(1);

      const result = await service.userHasOfficeAccess('user-1', 'office-1');

      expect(result).toBe(true);
    });

    it('should return false if user does not have access', async () => {
      userOfficeRoleRepository.count.mockResolvedValue(0);

      const result = await service.userHasOfficeAccess('user-1', 'office-1');

      expect(result).toBe(false);
    });
  });

  describe('userHasRole', () => {
    it('should return true if user has role via UserOfficeRole', async () => {
      const mockUserOfficeRoles = [
        {
          id: 'uor-1',
          userId: 'user-1',
          roleId: 'role-1',
          role: { id: 'role-1', name: 'tech_officer' },
        } as UserOfficeRole,
      ];
      
      userOfficeRoleRepository.find.mockResolvedValue(mockUserOfficeRoles);

      const result = await service.userHasRole('user-1', 'tech_officer');

      expect(result).toBe(true);
    });

    it('should return false if user does not have role', async () => {
      userOfficeRoleRepository.find.mockResolvedValue([]);
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.userHasRole('user-1', 'tech_officer');

      expect(result).toBe(false);
    });

    it('should fallback to deprecated role field if no UserOfficeRole assignments', async () => {
      userOfficeRoleRepository.find.mockResolvedValue([]);
      userRepository.findOne.mockResolvedValue({
        id: 'user-1',
        role: { id: 'role-1', name: 'admin' },
      } as User);

      const result = await service.userHasRole('user-1', 'admin');

      expect(result).toBe(true);
    });
  });

  describe('createMunicipalityUser with officeRoleAssignments', () => {
    it('should create user with multiple office-role assignments', async () => {
      const createDto: CreateMunicipalityUserDto = {
        email: 'tech@test.com',
        username: 'techofficer',
        firstName: 'Tech',
        lastName: 'Officer',
        password: 'password',
        officeRoleAssignments: [
          { officeId: 'office-1', roleId: 'role-1' },
          { officeId: 'office-2', roleId: 'role-1' },
        ],
      };

      const mockRole = { id: 'role-1', name: 'tech_officer' } as Role;
      const mockOffice1 = { id: 'office-1', isExternal: false } as Office;
      const mockOffice2 = { id: 'office-2', isExternal: false } as Office;

      roleRepository.findOne.mockResolvedValue(mockRole);
      officeRepository.findOne
        .mockResolvedValueOnce(mockOffice1)
        .mockResolvedValueOnce(mockOffice2);
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      userOfficeRoleRepository.findOne.mockResolvedValue(null);
      profileRepository.create.mockReturnValue({} as Profile);
      profileRepository.save.mockResolvedValue({} as Profile);

      const createdUser = { id: 'new-tech-officer' } as User;
      userRepository.create.mockReturnValue(createdUser);
      userRepository.save.mockResolvedValue(createdUser);
      accountRepository.create.mockReturnValue({} as Account);
      userOfficeRoleRepository.create.mockReturnValue({} as UserOfficeRole);
      userOfficeRoleRepository.save.mockResolvedValue({} as UserOfficeRole);

      const result = await service.createMunicipalityUser(createDto);

      expect(result).toEqual(createdUser);
      expect(userOfficeRoleRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException if neither officeRoleAssignments nor roleId provided', async () => {
      const createDto: CreateMunicipalityUserDto = {
        email: 'invalid@test.com',
        username: 'invalid',
        firstName: 'Invalid',
        lastName: 'User',
        password: 'password',
      };

      await expect(service.createMunicipalityUser(createDto)).rejects.toThrow(
        new BadRequestException(USER_ERROR_MESSAGES.MISSING_ROLE_ASSIGNMENT_DATA),
      );
    });

    it('should throw BadRequestException when non-tech_officer tries multiple assignments', async () => {
      const createDto: CreateMunicipalityUserDto = {
        email: 'admin@test.com',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        password: 'password',
        officeRoleAssignments: [
          { officeId: 'office-1', roleId: 'admin-role' },
          { officeId: 'office-2', roleId: 'admin-role' },
        ],
      };

      const mockRole = { id: 'admin-role', name: 'admin' } as Role;
      const mockOffice = { id: 'office-1', isExternal: false } as Office;
      
      roleRepository.findOne.mockResolvedValue(mockRole);
      officeRepository.findOne.mockResolvedValue(mockOffice);
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(service.createMunicipalityUser(createDto)).rejects.toThrow(
        new BadRequestException(
          USER_ERROR_MESSAGES.CANNOT_ASSIGN_MULTIPLE_ROLES_TO_NON_TECH_OFFICER,
        ),
      );
    });
  });
});
