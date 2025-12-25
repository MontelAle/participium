import { Account, Category, Office, Profile, Role, User } from '@entities';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MinioProvider } from '../../providers/minio/minio.provider';
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
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    accountRepository = module.get(getRepositoryToken(Account));
    roleRepository = module.get(getRepositoryToken(Role));
    officeRepository = module.get(getRepositoryToken(Office));
    profileRepository = module.get(getRepositoryToken(Profile)); // <-- Add this line

    mockManager.getRepository.mockImplementation((entity) => {
      if (entity === User) return userRepository;
      if (entity === Account) return accountRepository;
      if (entity === Role) return roleRepository;
      if (entity === Office) return officeRepository;
      if (entity === Profile) return profileRepository;
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
});
