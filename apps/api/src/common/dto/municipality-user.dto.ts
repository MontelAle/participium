import type {
  CreateMunicipalityUserDto as CreateMunicipalityUserDtoType,
  MunicipalityUserIdResponseDto as MunicipalityUserIdResponseDtoType,
  MunicipalityUserResponseDto as MunicipalityUserResponseDtoType,
  MunicipalityUsersResponseDto as MunicipalityUsersResponseDtoType,
  UpdateMunicipalityUserDto as UpdateMunicipalityUserDtoType,
} from '@repo/api';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { User } from '../entities/user.entity';

export class UpdateMunicipalityUserDto
  implements UpdateMunicipalityUserDtoType
{
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  @MaxLength(20)
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

export class CreateMunicipalityUserDto
  implements CreateMunicipalityUserDtoType
{
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  password: string;

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
  roleId: string;

  @IsString()
  @IsOptional()
  officeId?: string;
}

export class MunicipalityUserResponseDto
  implements MunicipalityUserResponseDtoType
{
  data: User;
  success: boolean;
}

export class MunicipalityUsersResponseDto
  implements MunicipalityUsersResponseDtoType
{
  data: User[];
  success: boolean;
}

export class MunicipalityUserIdResponseDto
  implements MunicipalityUserIdResponseDtoType
{
  data: { id: string };
  success: boolean;
}

export class ExternalMaintainersResponseDto {
  data: User[];
  success: boolean;
}
