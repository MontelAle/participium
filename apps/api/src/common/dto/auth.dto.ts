import { IsNotEmpty, IsString, MinLength, IsEmail } from 'class-validator';
import {
  LoginDto as LoginDtoInterface,
  RegisterDto as RegisterDtoInterface,
  LoginResponseDto as LoginResponseDtoInterface,
  LogoutResponseDto as LogoutResponseDtoInterface,
} from '@repo/api';
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
