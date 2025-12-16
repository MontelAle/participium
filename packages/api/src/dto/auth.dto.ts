import { Session, User } from '@entities';
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
