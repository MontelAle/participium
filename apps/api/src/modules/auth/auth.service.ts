import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/user.entity';
import { Account } from 'src/common/entities/account.entity';
import { RegisterDto } from 'src/common/dto/register.dto';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async findUserById(id: number) {
    return await this.userRepository.findOne({ where: { id } });
  }

  async register(dto: RegisterDto) {
    const { email, username, firstName, lastName, password } = dto;

    const hashedPassword = await bcrypt.hash(password, 10);

    return await this.userRepository.manager.transaction(async (manager) => {
      const newUser = manager.getRepository(User).create({
        email,
        username,
        firstName,
        lastName,
      });
      const savedUser = await manager.getRepository(User).save(newUser);

      const newAccount = manager.getRepository(Account).create({
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
