import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Account, RegisterDto, Role } from '@repo/api';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findUserById(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async validateUser(email: string, password: string) {
    const account = await this.accountRepository.findOne({
      where: { providerId: 'local', accountId: email },
      relations: ['user'],
    });
    if (!account) return null;
    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) return null;
    return { user: account.user };
  }

  async register(dto: RegisterDto) {
    const { email, username, firstName, lastName, password } = dto;

    const hashedPassword = await bcrypt.hash(password, 10);

    return await this.userRepository.manager.transaction(async (manager) => {
      // Recupera o crea il role di default "user"
      let defaultRole = await manager.getRepository(Role).findOne({
        where: { name: 'user' },
      });

      if (!defaultRole) {
        defaultRole = await manager.getRepository(Role).save({
          roleId: nanoid(8),
          name: 'user',
        });
      }

      const newUser = manager.getRepository(User).create({
        id: nanoid(8),
        email,
        username,
        firstName,
        lastName,
        role: defaultRole,
      });
      const savedUser = await manager.getRepository(User).save(newUser);

      const newAccount = manager.getRepository(Account).create({
        id: nanoid(8),
        accountId: savedUser.email,
        providerId: 'local',
        userId: savedUser.id,
        password: hashedPassword,
        user: savedUser,
      });
      await manager.getRepository(Account).save(newAccount);

      return {
        user: savedUser,
      };
    });
  }
}
