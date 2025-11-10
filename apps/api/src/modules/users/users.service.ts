import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { User, Account, Role, CreateMunicipalityUserDto } from '@repo/api';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findMunicipalityUsers(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['role'],
      where: {
        role: {
          name: Not('user'),
        },
      },
    });
  }

  async findMunicipalityUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });
  }

  async createMunicipalityUser(dto: CreateMunicipalityUserDto): Promise<User> {
    const { email, username, firstName, lastName, password, role: roleId } = dto;

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.userRepository.manager.transaction(async (manager) => {
      const role = await manager.getRepository(Role).findOne({ where: { id: roleId } });
      
      if (!role) {
        throw new NotFoundException(`Role not found`);
      }

      const existingUser = await manager.getRepository(User).findOne({ 
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const newUser = manager.getRepository(User).create({
        id: nanoid(),
        email,
        username,
        firstName,
        lastName,
        role,
      });

      const user = await manager.getRepository(User).save(newUser);

      const newAccount = manager.getRepository(Account).create({
        id: nanoid(),
        accountId: email,
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
    await this.userRepository.manager.transaction(async (manager) => {
      await manager.getRepository(Account).delete({ userId: id });
      await manager.getRepository(User).delete({ id });
    });
  }

  async updateMunicipalityUserById(id: string, dto: Partial<CreateMunicipalityUserDto>): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verifies email if already in use
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    if (dto.email) user.email = dto.email;
    if (dto.username) user.username = dto.username;
    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;

    // we can get rid of this if the admin can select only from a list
    if (dto.role) {
      const role = await this.roleRepository.findOne({
        where: { name: dto.role },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      user.roleId = role.id;
    }

    await this.userRepository.save(user);
  }
}
