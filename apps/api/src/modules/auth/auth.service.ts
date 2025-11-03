import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/user.entity';
import { Account } from 'src/common/entities/account.entity';
import { RegisterDto } from 'src/common/dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async createAccount(dto: RegisterDto) {
    const { email, username, firstName, lastName, password } = dto;

    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      throw new BadRequestException('Email or username already exists');}

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      email,
      username,
      firstName,
      lastName,
    });

    const savedUser = await this.userRepository.save(newUser);

    const newAccount = this.accountRepository.create({
      accountId: savedUser.email,  
      providerId: 'local',                
      userId: savedUser.id.toString(),
      password: hashedPassword,
      user: savedUser,
    });

    await this.accountRepository.save(newAccount);

    return savedUser;
  }
}


