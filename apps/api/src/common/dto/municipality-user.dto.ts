import type {
  CreateMunicipalityUserDto as CreateMunicipalityUserDtoType,
  MunicipalityUserIdResponseDto as MunicipalityUserIdResponseDtoType,
  MunicipalityUserResponseDto as MunicipalityUserResponseDtoType,
  MunicipalityUsersResponseDto as MunicipalityUsersResponseDtoType,
  UpdateMunicipalityUserDto as UpdateMunicipalityUserDtoType,
} from '@repo/api';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { User } from '../entities/user.entity';

export class UpdateMunicipalityUserDto
  implements UpdateMunicipalityUserDtoType
{
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
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
  password: string;

  @IsEmail()
  email: string;

  @IsString()
  username: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
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
