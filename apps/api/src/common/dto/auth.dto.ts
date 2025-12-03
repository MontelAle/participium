import {
  LoginDto as LoginDtoInterface,
  LoginResponseDto as LoginResponseDtoInterface,
  LogoutResponseDto as LogoutResponseDtoInterface,
  RegisterDto as RegisterDtoInterface,
} from '@repo/api';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';

export class LoginDto implements LoginDtoInterface {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
}

export class RegisterDto implements RegisterDtoInterface {
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

export class LoginResponseDto implements LoginResponseDtoInterface {
  success: boolean;
  data: {
    user: User;
    session: Partial<Session>;
  };
}

export class LogoutResponseDto implements LogoutResponseDtoInterface {
  success: boolean;
}
