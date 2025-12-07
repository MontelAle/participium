import type {
  LoginDto as LoginDtoType,
  LoginResponseDto as LoginResponseDtoType,
  LogoutResponseDto as LogoutResponseDtoType,
  RegisterDto as RegisterDtoType,
} from '@repo/api';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';

export class LoginDto implements LoginDtoType {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  password: string;
}

export class RegisterDto implements RegisterDtoType {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  username: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
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
