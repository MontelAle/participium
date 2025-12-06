import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { ResponseDto } from './response.dto';

export interface RegisterDto {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponseDto extends ResponseDto {
  data: {
    user: User;
    session: Partial<Session>;
  };
}

export interface LogoutResponseDto extends ResponseDto {}
