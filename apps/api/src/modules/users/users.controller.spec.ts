import { User } from '@entities';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateMunicipalityUserDto,
  OfficeRoleAssignmentDto,
  UpdateMunicipalityUserDto,
} from './dto/municipality-users.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

jest.mock('nanoid', () => ({ nanoid: () => 'mocked-id' }));

const mockSessionGuard = { canActivate: jest.fn(() => true) };
const mockRolesGuard = { canActivate: jest.fn(() => true) };

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const mockUsersService: Partial<jest.Mocked<UsersService>> = {
      findMunicipalityUsers: jest.fn(),
      findMunicipalityUserById: jest.fn(),
      createMunicipalityUser: jest.fn(),
      deleteMunicipalityUserById: jest.fn(),
      updateMunicipalityUserById: jest.fn(),
      findExternalMaintainers: jest.fn(),
      getUserOfficeRoles: jest.fn(),
      assignUserToOffice: jest.fn(),
      removeUserFromOffice: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    })
      .overrideGuard(require('../auth/guards/session-auth.guard').SessionGuard)
      .useValue(mockSessionGuard)
      .overrideGuard(require('../auth/guards/roles.guard').RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  describe('getMunicipalityUsers', () => {
    it('should return a list of municipality users', async () => {
      const mockUsers: Partial<User>[] = [
        { id: '1', username: 'officier1' },
        { id: '2', username: 'officier2' },
      ];

      usersService.findMunicipalityUsers.mockResolvedValue(mockUsers as User[]);

      const result = await controller.getMunicipalityUsers();

      expect(usersService.findMunicipalityUsers).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: true, data: mockUsers });
    });
  });

  describe('getMunicipalityUserById', () => {
    it('should return a municipality user by id', async () => {
      const mockUser: Partial<User> = {
        id: '1',
        username: 'officier1',
        role: {
          id: 'role-id',
          name: 'municipal_pr_officer',
          label: 'Municipal PR Officer',
          isMunicipal: true,
        },
      } as any;

      usersService.findMunicipalityUserById.mockResolvedValue(mockUser as User);

      const result = await controller.getMunicipalityUserById('1');

      expect(usersService.findMunicipalityUserById).toHaveBeenCalledWith('1');
      expect(result).toEqual({ success: true, data: mockUser });
    });

    it('should throw if UsersService.findMunicipalityUserById throws', async () => {
      usersService.findMunicipalityUserById.mockRejectedValue(
        new NotFoundException('Municipality user not found'),
      );

      await expect(controller.getMunicipalityUserById('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createMunicipalityUser', () => {
    it('should create and return a municipality user', async () => {
      const dto: CreateMunicipalityUserDto = {
        email: 'new@municipality.gov',
        username: 'new_user',
        firstName: 'New',
        lastName: 'User',
        password: 'SecurePass123',
        roleId: 'role-id',
      };

      const mockUser: Partial<User> = {
        id: 'mocked-id',
        email: dto.email,
        username: dto.username,
      };

      usersService.createMunicipalityUser.mockResolvedValue(mockUser as User);

      const result = await controller.createMunicipalityUser(dto);

      expect(usersService.createMunicipalityUser).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ success: true, data: mockUser });
    });

    it('should throw if UsersService.createMunicipalityUser throws', async () => {
      const dto: CreateMunicipalityUserDto = {
        email: 'duplicate@municipality.gov',
        username: 'dup_user',
        firstName: 'Dup',
        lastName: 'User',
        password: 'SecurePass123',
        roleId: 'role-id',
      };

      usersService.createMunicipalityUser.mockRejectedValue(
        new ConflictException('User with this username already exists'),
      );

      await expect(controller.createMunicipalityUser(dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deleteMunicipalityUserById', () => {
    it('should delete a municipality user and return success', async () => {
      usersService.deleteMunicipalityUserById.mockResolvedValue(undefined);

      const result = await controller.deleteMunicipalityUserById('1');

      expect(usersService.deleteMunicipalityUserById).toHaveBeenCalledWith('1');
      expect(result).toEqual({ success: true, data: { id: '1' } });
    });

    it('should throw if UsersService.deleteMunicipalityUserById throws', async () => {
      usersService.deleteMunicipalityUserById.mockRejectedValue(
        new NotFoundException('Municipality user not found'),
      );

      await expect(
        controller.deleteMunicipalityUserById('999'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMunicipalityUserById', () => {
    it('should update a municipality user and return success', async () => {
      const dto: UpdateMunicipalityUserDto = {
        email: 'updated@municipality.gov',
        username: 'updated_user',
      };

      usersService.updateMunicipalityUserById.mockResolvedValue(undefined);

      const result = await controller.updateMunicipalityUserById('1', dto);

      expect(usersService.updateMunicipalityUserById).toHaveBeenCalledWith(
        '1',
        dto,
      );
      expect(result).toEqual({ success: true, data: { id: '1' } });
    });

    it('should throw if UsersService.updateMunicipalityUserById throws NotFoundException', async () => {
      const dto: UpdateMunicipalityUserDto = {
        email: 'updated@municipality.gov',
        username: 'updated_user',
      };

      usersService.updateMunicipalityUserById.mockRejectedValue(
        new NotFoundException('Municipality user not found'),
      );

      await expect(
        controller.updateMunicipalityUserById('999', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if UsersService.updateMunicipalityUserById throws ConflictException', async () => {
      const dto: UpdateMunicipalityUserDto = {
        username: 'duplicate_user',
      };

      usersService.updateMunicipalityUserById.mockRejectedValue(
        new ConflictException('Username already in use'),
      );

      await expect(
        controller.updateMunicipalityUserById('1', dto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getExternalMaintainers', () => {
    it('should return all external maintainers when no categoryId provided', async () => {
      const mockMaintainers: Partial<User>[] = [
        { id: '1', username: 'maintainer1' },
        { id: '2', username: 'maintainer2' },
      ];

      usersService.findExternalMaintainers.mockResolvedValue(
        mockMaintainers as User[],
      );

      const result = await controller.getExternalMaintainers();

      expect(usersService.findExternalMaintainers).toHaveBeenCalledWith(
        undefined,
      );
      expect(result).toEqual({ success: true, data: mockMaintainers });
    });

    it('should return filtered external maintainers when categoryId provided', async () => {
      const mockMaintainers: Partial<User>[] = [
        { id: '1', username: 'maintainer1' },
      ];

      usersService.findExternalMaintainers.mockResolvedValue(
        mockMaintainers as User[],
      );

      const result = await controller.getExternalMaintainers('category-1');

      expect(usersService.findExternalMaintainers).toHaveBeenCalledWith(
        'category-1',
      );
      expect(result).toEqual({ success: true, data: mockMaintainers });
    });
  });

  describe('getUserOfficeRoles', () => {
    it('should return office roles assignments for a user', async () => {
      const mockAssignments = [
        {
          id: 'assign-1',
          role: { name: 'role1' },
          office: { name: 'office1' },
        },
      ];

      usersService.getUserOfficeRoles.mockResolvedValue(mockAssignments as any);

      const result = await controller.getUserOfficeRoles('u1');

      expect(usersService.getUserOfficeRoles).toHaveBeenCalledWith('u1');
      expect(result).toEqual({ success: true, data: mockAssignments });
    });
  });

  describe('assignUserToOffice', () => {
    it('should assign user to office and return the assignment wrapped in array', async () => {
      const dto: OfficeRoleAssignmentDto = {
        officeId: 'off-1',
        roleId: 'role-1',
      };

      const mockAssignment = {
        id: 'assign-1',
        userId: 'u1',
        officeId: 'off-1',
        roleId: 'role-1',
      };

      usersService.assignUserToOffice.mockResolvedValue(mockAssignment as any);

      const result = await controller.assignUserToOffice('u1', dto);

      expect(usersService.assignUserToOffice).toHaveBeenCalledWith(
        'u1',
        dto.officeId,
        dto.roleId,
      );
      expect(result).toEqual({ success: true, data: [mockAssignment] });
    });
  });

  describe('removeUserFromOffice', () => {
    it('should remove user from office and return user id', async () => {
      usersService.removeUserFromOffice.mockResolvedValue(undefined);

      const result = await controller.removeUserFromOffice('u1', 'off-1');

      expect(usersService.removeUserFromOffice).toHaveBeenCalledWith(
        'u1',
        'off-1',
      );
      expect(result).toEqual({ success: true, data: { id: 'u1' } });
    });

    it('should throw if service throws NotFoundException', async () => {
      usersService.removeUserFromOffice.mockRejectedValue(
        new NotFoundException('Assignment not found'),
      );

      await expect(
        controller.removeUserFromOffice('u1', 'off-invalid'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
