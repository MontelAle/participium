import { Account, Category, Office, Profile, Report, Role, User, UserOfficeRole } from '@entities';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { Repository } from 'typeorm';
import { MinioProvider } from '../../providers/minio/minio.provider';
import { ReportsService } from '../reports/reports.service';
import { USER_ERROR_MESSAGES } from './constants/error-messages';
import {
  CreateMunicipalityUserDto,
  OfficeRoleAssignmentDto,
} from './dto/municipality-users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(Office)
    private readonly officeRepository: Repository<Office>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(UserOfficeRole)
    private readonly userOfficeRoleRepository: Repository<UserOfficeRole>,

    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,

    private readonly minioProvider: MinioProvider,

    private readonly reportsService: ReportsService,
  ) {}

  async findMunicipalityUsers(categoryId?: string): Promise<User[]> {
    if (categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
        relations: ['office'],
      });

      if (!category) {
        throw new NotFoundException(
          USER_ERROR_MESSAGES.CATEGORY_NOT_FOUND(categoryId),
        );
      }

      if (!category.office) {
        throw new BadRequestException(
          USER_ERROR_MESSAGES.CATEGORY_NO_OFFICE(categoryId),
        );
      }

      const users = await this.userRepository.find({
        where: {
          role: { isMunicipal: true },
          officeId: category.office.id,
        },
        relations: ['role', 'office'],
        order: { firstName: 'ASC', lastName: 'ASC' },
      });

      if (users.length === 0) {
        throw new NotFoundException(
          USER_ERROR_MESSAGES.NO_OFFICERS_FOR_CATEGORY(categoryId),
        );
      }

      return users;
    }

    return this.userRepository.find({
      relations: ['role', 'office'],
      where: {
        role: {
          isMunicipal: true,
        },
      },
      order: { firstName: 'ASC', lastName: 'ASC' },
    });
  }

  async findMunicipalityUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      relations: ['role', 'office'],
      where: {
        id,
        role: {
          isMunicipal: true,
        },
      },
    });

    if (!user) {
      throw new NotFoundException(
        USER_ERROR_MESSAGES.MUNICIPALITY_USER_NOT_FOUND,
      );
    }

    return user;
  }

  async createMunicipalityUser(dto: CreateMunicipalityUserDto): Promise<User> {
    const { email, username, firstName, lastName, password } = dto;

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.userRepository.manager.transaction(async (manager) => {
      // Check for existing username/email
      const existingUser = await manager.getRepository(User).findOne({
        where: { username },
      });
      if (existingUser) {
        throw new ConflictException(
          USER_ERROR_MESSAGES.USERNAME_ALREADY_EXISTS,
        );
      }

      const existingEmail = await manager.getRepository(User).findOne({
        where: { email },
      });
      if (existingEmail) {
        throw new ConflictException(USER_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
      }

      // Determine which API to use: new (officeRoleAssignments) or legacy (roleId/officeId)
      let assignments: OfficeRoleAssignmentDto[] = [];

      if (dto.officeRoleAssignments && dto.officeRoleAssignments.length > 0) {
        // New API: use officeRoleAssignments
        assignments = dto.officeRoleAssignments;
      } else if (dto.roleId) {
        // Legacy API: convert roleId/officeId to single assignment
        assignments = [
          {
            roleId: dto.roleId,
            officeId: dto.officeId || null,
          },
        ];
      } else {
        throw new BadRequestException(
          USER_ERROR_MESSAGES.MISSING_ROLE_ASSIGNMENT_DATA,
        );
      }

      // Validate all assignments
      const roleRepo = manager.getRepository(Role);
      const officeRepo = manager.getRepository(Office);

      // Check if multiple assignments for non-tech_officer
      if (assignments.length > 1) {
        const firstRole = await roleRepo.findOne({
          where: { id: assignments[0].roleId },
        });
        if (firstRole && firstRole.name !== 'tech_officer') {
          throw new BadRequestException(
            USER_ERROR_MESSAGES.CANNOT_ASSIGN_MULTIPLE_ROLES_TO_NON_TECH_OFFICER,
          );
        }
      }

      for (const assignment of assignments) {
        const role = await roleRepo.findOne({
          where: { id: assignment.roleId },
        });
        if (!role) {
          throw new NotFoundException(USER_ERROR_MESSAGES.ROLE_NOT_FOUND);
        }

        const office = assignment.officeId
          ? await officeRepo.findOne({ where: { id: assignment.officeId } })
          : null;

        if (assignment.officeId && !office) {
          throw new NotFoundException(USER_ERROR_MESSAGES.OFFICE_NOT_FOUND);
        }

        // Validate that officeId is provided
        // (validateOfficeRoleMatch will provide more specific errors for external_maintainer)
        if (!assignment.officeId && role.name !== 'external_maintainer') {
          throw new BadRequestException(
            'officeId is required when using roleId',
          );
        }

        this.validateOfficeRoleMatch(role, office);
      }

      // Use first assignment for deprecated user.role and user.office fields
      const firstAssignment = assignments[0];
      const firstRole = await roleRepo.findOne({
        where: { id: firstAssignment.roleId },
      });
      const firstOffice = firstAssignment.officeId
        ? await officeRepo.findOne({ where: { id: firstAssignment.officeId } })
        : null;

      // Create user with deprecated fields
      const newUser = manager.getRepository(User).create({
        id: nanoid(),
        email,
        username,
        firstName,
        lastName,
        role: firstRole,
        office: firstOffice,
      });

      const user = await manager.getRepository(User).save(newUser);

      // Create UserOfficeRole assignments
      const userOfficeRoleRepo = manager.getRepository(UserOfficeRole);
      for (const assignment of assignments) {
        const role = await roleRepo.findOne({
          where: { id: assignment.roleId },
        });
        const office = assignment.officeId
          ? await officeRepo.findOne({ where: { id: assignment.officeId } })
          : null;

        const userOfficeRole = userOfficeRoleRepo.create({
          id: nanoid(),
          userId: user.id,
          officeId: assignment.officeId,
          roleId: assignment.roleId,
          user,
          office,
          role,
        });

        await userOfficeRoleRepo.save(userOfficeRole);
      }

      // Create account
      const newAccount = manager.getRepository(Account).create({
        id: nanoid(),
        accountId: username,
        providerId: 'local',
        userId: user.id,
        password: hashedPassword,
        user,
      });

      await manager.getRepository(Account).save(newAccount);

      // Create profile
      const newProfile = manager.getRepository(Profile).create({
        id: nanoid(),
        userId: user.id,
        user,
        emailNotificationsEnabled: true,
      });

      await manager.getRepository(Profile).save(newProfile);

      return user;
    });
  }

  async deleteMunicipalityUserById(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      relations: ['role'],
      where: {
        id,
        role: {
          isMunicipal: true,
        },
      },
    });

    if (!user) {
      throw new NotFoundException(
        USER_ERROR_MESSAGES.MUNICIPALITY_USER_NOT_FOUND,
      );
    }

    await this.userRepository.manager.transaction(async (manager) => {
      // Delete UserOfficeRole assignments (cascade will handle this, but explicit for clarity)
      await manager.getRepository(UserOfficeRole).delete({ userId: id });
      await manager.getRepository(Account).delete({ userId: id });
      await manager.getRepository(Profile).delete({ userId: id });
      await manager.getRepository(User).delete({ id });
    });
  }

  async updateMunicipalityUserById(
    id: string,
    dto: Partial<CreateMunicipalityUserDto>,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(
        USER_ERROR_MESSAGES.MUNICIPALITY_USER_NOT_FOUND,
      );
    }

    if (dto.username && dto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: dto.username },
      });

      if (existingUser) {
        throw new ConflictException(
          USER_ERROR_MESSAGES.USERNAME_ALREADY_EXISTS,
        );
      }
    }

    if (dto.email && dto.email !== user.email) {
      const existingUserWithEmail = await this.userRepository.findOne({
        where: { email: dto.email },
      });

      if (existingUserWithEmail) {
        throw new ConflictException(USER_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
      }
    }

    await this.userRepository.manager.transaction(async (manager) => {
      if (dto.email) user.email = dto.email;
      if (dto.username) user.username = dto.username;
      if (dto.firstName) user.firstName = dto.firstName;
      if (dto.lastName) user.lastName = dto.lastName;

      let updatedRole = user.role;
      let updatedOffice = user.office;

      if (dto.roleId) {
        const role = await this.roleRepository.findOne({
          where: { id: dto.roleId },
        });

        if (!role) {
          throw new NotFoundException(USER_ERROR_MESSAGES.ROLE_NOT_FOUND);
        }

        user.roleId = role.id;
        updatedRole = role;
      }

      if (dto.officeId) {
        const office = await this.officeRepository.findOne({
          where: { id: dto.officeId },
        });

        if (!office) {
          throw new NotFoundException(USER_ERROR_MESSAGES.OFFICE_NOT_FOUND);
        }

        user.officeId = office.id;
        updatedOffice = office;
      }

      this.validateOfficeRoleMatch(updatedRole, updatedOffice);

      await manager.getRepository(User).save(user);

      if (dto.username) {
        const account = await manager.getRepository(Account).findOne({
          where: { userId: id, providerId: 'local' },
        });

        if (account) {
          account.accountId = dto.username;
          await manager.getRepository(Account).save(account);
        }
      }
    });
  }

  private validateOfficeRoleMatch(role: Role, office: Office | null): void {
    const isExternalMaintainer = role.name === 'external_maintainer';
    const hasExternalOffice = office && office.isExternal;

    // Check if external maintainer has no office first (more specific error)
    if (isExternalMaintainer && !office) {
      throw new BadRequestException(
        USER_ERROR_MESSAGES.EXTERNAL_MAINTAINER_NO_OFFICE,
      );
    }

    // Check if external maintainer has non-external office
    if (isExternalMaintainer && !hasExternalOffice) {
      throw new BadRequestException(
        USER_ERROR_MESSAGES.EXTERNAL_MAINTAINER_WRONG_OFFICE,
      );
    }

    // Check if non-external maintainer has external office
    if (!isExternalMaintainer && hasExternalOffice) {
      throw new BadRequestException(
        USER_ERROR_MESSAGES.REGULAR_USER_EXTERNAL_OFFICE,
      );
    }
  }

  async findExternalMaintainers(categoryId?: string): Promise<User[]> {
    if (categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
        relations: ['externalOffice'],
      });

      if (!category) {
        throw new NotFoundException(
          USER_ERROR_MESSAGES.CATEGORY_NOT_FOUND(categoryId),
        );
      }

      if (!category.externalOffice) {
        throw new BadRequestException(
          USER_ERROR_MESSAGES.CATEGORY_NO_EXTERNAL_OFFICE(categoryId),
        );
      }

      const maintainers = await this.userRepository.find({
        where: {
          role: { name: 'external_maintainer' },
          officeId: category.externalOffice.id,
        },
        relations: ['role', 'office'],
        order: { firstName: 'ASC', lastName: 'ASC' },
      });

      if (maintainers.length === 0) {
        throw new NotFoundException(
          USER_ERROR_MESSAGES.NO_EXTERNAL_MAINTAINERS_FOR_CATEGORY(categoryId),
        );
      }

      return maintainers;
    }

    return this.userRepository.find({
      where: {
        role: { name: 'external_maintainer' },
      },
      relations: ['role', 'office'],
      order: { firstName: 'ASC', lastName: 'ASC' },
    });
  }

  // ============================================================================
  // UserOfficeRole Management Methods
  // ============================================================================

  /**
   * Get all office role assignments for a user
   */
  async getUserOfficeRoles(userId: string): Promise<UserOfficeRole[]> {
    return this.userOfficeRoleRepository.find({
      where: { userId },
      relations: ['office', 'role'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get all offices where a user has assignments
   */
  async getUserOffices(userId: string): Promise<Office[]> {
    const assignments = await this.userOfficeRoleRepository.find({
      where: { userId },
      relations: ['office'],
    });
    return assignments.map((a) => a.office);
  }

  /**
   * Get all roles a user has across all offices
   * Falls back to deprecated single role if no assignments exist
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    const assignments = await this.userOfficeRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    if (assignments.length > 0) {
      // Remove duplicates by role ID
      const uniqueRoles = new Map<string, Role>();
      for (const assignment of assignments) {
        uniqueRoles.set(assignment.role.id, assignment.role);
      }
      return Array.from(uniqueRoles.values());
    }

    // Fallback to deprecated single role for backward compatibility
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    return user?.role ? [user.role] : [];
  }

  /**
   * Assign a user to an office with a specific role
   * Only tech_officer can have multiple office assignments
   */
  async assignUserToOffice(
    userId: string,
    officeId: string,
    roleId: string,
  ): Promise<UserOfficeRole> {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(USER_ERROR_MESSAGES.USER_NOT_FOUND(userId));
    }

    // Verify role exists
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(USER_ERROR_MESSAGES.ROLE_NOT_FOUND);
    }

    // Verify office exists
    const office = await this.officeRepository.findOne({
      where: { id: officeId },
    });

    if (!office) {
      throw new NotFoundException(USER_ERROR_MESSAGES.OFFICE_NOT_FOUND);
    }

    // Prevent mixing tech_officer and external_maintainer roles
    const existingRoles = await this.userOfficeRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    const hasExternalMaintainer = existingRoles.some(
      (assignment) => assignment.role.name === 'external_maintainer',
    );
    const hasTechOfficer = existingRoles.some(
      (assignment) => assignment.role.name === 'tech_officer',
    );

    if (
      (role.name === 'tech_officer' && hasExternalMaintainer) ||
      (role.name === 'external_maintainer' && hasTechOfficer)
    ) {
      throw new BadRequestException(
        USER_ERROR_MESSAGES.CANNOT_MIX_TECH_OFFICER_AND_EXTERNAL_MAINTAINER,
      );
    }

    // Only tech_officer can have multiple office assignments
    if (role.name !== 'tech_officer') {
      const existingAssignments = await this.userOfficeRoleRepository.count({
        where: { userId },
      });

      if (existingAssignments > 0) {
        throw new BadRequestException(
          USER_ERROR_MESSAGES.CANNOT_ASSIGN_MULTIPLE_ROLES_TO_NON_TECH_OFFICER,
        );
      }
    }

    // Check if assignment already exists
    const existingAssignment = await this.userOfficeRoleRepository.findOne({
      where: { userId, officeId },
    });

    if (existingAssignment) {
      throw new ConflictException(
        USER_ERROR_MESSAGES.USER_OFFICE_ROLE_ALREADY_EXISTS,
      );
    }

    // Validate office-role match (external maintainer logic)
    this.validateOfficeRoleMatch(role, office);

    // Create new assignment
    const assignment = this.userOfficeRoleRepository.create({
      id: nanoid(),
      userId,
      officeId,
      roleId,
      user,
      office,
      role,
    });

    return this.userOfficeRoleRepository.save(assignment);
  }

  /**
   * Remove a user's assignment from an office
   */
  async removeUserFromOffice(
    userId: string,
    officeId: string,
  ): Promise<void> {
    const assignment = await this.userOfficeRoleRepository.findOne({
      where: { userId, officeId },
    });

    if (!assignment) {
      throw new NotFoundException(
        USER_ERROR_MESSAGES.USER_OFFICE_ROLE_NOT_FOUND,
      );
    }

    // Check if this is the last role assignment
    const totalAssignments = await this.userOfficeRoleRepository.count({
      where: { userId },
    });

    if (totalAssignments <= 1) {
      throw new BadRequestException(
        USER_ERROR_MESSAGES.MUST_KEEP_AT_LEAST_ONE_ROLE,
      );
    }

    // Find orphan reports: reports assigned to this user for categories of this office
    // Only reassign reports in intermediate states (assigned, in_progress, suspended)
    const orphanReports = await this.reportRepository
      .createQueryBuilder('report')
      .innerJoin('report.category', 'category')
      .where('report.assignedOfficerId = :userId', { userId })
      .andWhere('category.officeId = :officeId', { officeId })
      .andWhere('report.status IN (:...statuses)', {
        statuses: ['assigned', 'in_progress', 'suspended'],
      })
      .getMany();

    // Reassign each orphan report to another available officer
    if (orphanReports.length > 0) {
      for (const report of orphanReports) {
        // Find another officer with the fewest reports in this office
        const newOfficer =
          await this.reportsService.findOfficerWithFewestReports(officeId);

        // If an officer is found, assign the report; otherwise set to null (unassigned)
        report.assignedOfficerId = newOfficer?.id || null;
        await this.reportRepository.save(report);
      }
    }

    // Finally, remove the user's assignment from the office
    await this.userOfficeRoleRepository.delete({ id: assignment.id });
  }

  /**
   * Check if a user has access to a specific office
   */
  async userHasOfficeAccess(
    userId: string,
    officeId: string,
  ): Promise<boolean> {
    const count = await this.userOfficeRoleRepository.count({
      where: { userId, officeId },
    });
    return count > 0;
  }

  /**
   * Check if a user has a specific role
   * Checks both new assignments and deprecated single role
   */
  async userHasRole(userId: string, roleName: string): Promise<boolean> {
    // Check new assignments
    const assignments = await this.userOfficeRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    const hasRole = assignments.some(
      (assignment) => assignment.role?.name === roleName,
    );

    if (hasRole) {
      return true;
    }

    // Fallback to deprecated single role
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    return user?.role?.name === roleName;
  }
}
