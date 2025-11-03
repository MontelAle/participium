import { Injectable } from '@nestjs/common';
import { User } from '../../common/entities/user.entity';
import { Account } from '../../common/entities/account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}
}
