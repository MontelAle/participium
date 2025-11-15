import { IsNotEmpty, IsString, MinLength, IsEmail } from 'class-validator';
import {
  LoginDto as LoginDtoInterface,
  RegisterDto as RegisterDtoInterface,
} from '@repo/api';

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
