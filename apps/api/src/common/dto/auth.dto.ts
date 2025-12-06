import type {
  LoginDto as LoginDtoType,
  LoginResponseDto as LoginResponseDtoType,
  LogoutResponseDto as LogoutResponseDtoType,
  RegisterDto as RegisterDtoType,
} from '@repo/api';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';

export class LoginDto implements LoginDtoType {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
}

export class RegisterDto implements RegisterDtoType {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
}

export class LoginResponseDto implements LoginResponseDtoType {
  success: boolean;
  data: {
    user: User;
    session: Partial<Session>;
  };
}

export class LogoutResponseDto implements LogoutResponseDtoType {
  success: boolean;
}
