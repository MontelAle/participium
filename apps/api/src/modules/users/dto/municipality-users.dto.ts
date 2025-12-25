import type { User } from '@entities';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateMunicipalityUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  @MaxLength(30)
  username?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  roleId?: string;

  @IsString()
  @IsOptional()
  officeId?: string;
}

export class CreateMunicipalityUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(30)
  password: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(30)
  username: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  roleId: string;

  @IsString()
  @IsOptional()
  officeId?: string;
}

export class MunicipalityUserResponseDto {
  data: User;
  success: boolean;
}

export class MunicipalityUsersResponseDto {
  data: User[];
  success: boolean;
}

export class MunicipalityUserIdResponseDto {
  data: { id: string };
  success: boolean;
}

export class ExternalMaintainersResponseDto {
  data: User[];
  success: boolean;
}
