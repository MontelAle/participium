import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
}

export class RegisterDto {
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

export class LoginResponseDto {
  success: boolean;
  data: {
    user: User;
    session: Partial<Session>;
  };
}

export class LogoutResponseDto {
  success: boolean;
}
