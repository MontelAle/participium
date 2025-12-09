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
import { CreateMunicipalityUserDto } from '../../common/dto/municipality-user.dto';
import { Account } from '../../common/entities/account.entity';
import { Category } from '../../common/entities/category.entity';
import { Office } from '../../common/entities/office.entity';
import { Role } from '../../common/entities/role.entity';
import { User } from '../../common/entities/user.entity';
import { MinioProvider } from '../../providers/minio/minio.provider';
import { USER_ERROR_MESSAGES } from './constants/error-messages';

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

    private readonly minioProvider: MinioProvider,
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
    const { email, username, firstName, lastName, password, roleId } = dto;

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.userRepository.manager.transaction(async (manager) => {
      const roleRepo = manager.getRepository(Role);
      const dbRole = await roleRepo.findOne({
        where: { id: roleId },
      });

      if (!dbRole) {
        throw new NotFoundException(USER_ERROR_MESSAGES.ROLE_NOT_FOUND);
      }

      const officeRepo = manager.getRepository(Office);
      const dbOffice = await officeRepo.findOne({
        where: { id: dto.officeId },
      });

      this.validateOfficeRoleMatch(dbRole, dbOffice);

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

      const newUser = manager.getRepository(User).create({
        id: nanoid(),
        email,
        username,
        firstName,
        lastName,
        role: dbRole,
        office: dbOffice || null,
      });

      const user = await manager.getRepository(User).save(newUser);

      const newAccount = manager.getRepository(Account).create({
        id: nanoid(),
        accountId: username,
        providerId: 'local',
        userId: user.id,
        password: hashedPassword,
        user,
      });

      await manager.getRepository(Account).save(newAccount);

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
      await manager.getRepository(Account).delete({ userId: id });
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
}
