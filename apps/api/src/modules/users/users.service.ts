import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      where: [
        { role: { name: 'admin' } },
        { role: { name: 'moderator' } },
      ],
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
        id: nanoid(8),
        email,
        username,
        firstName,
        lastName,
        role,
      });

      const user = await manager.getRepository(User).save(newUser);

      const newAccount = manager.getRepository(Account).create({
        id: nanoid(8),
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
}
