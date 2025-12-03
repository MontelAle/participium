import {
  CreateMunicipalityUserDto as CreateMunicipalityUserDtoInterface,
  MunicipalityUserIdResponseDto as MunicipalityUserIdResponseDtoInterface,
  MunicipalityUserResponseDto as MunicipalityUserResponseDtoInterface,
  MunicipalityUsersResponseDto as MunicipalityUsersResponseDtoInterface,
  UpdateMunicipalityUserDto as UpdateMunicipalityUserDtoInterface,
} from '@repo/api';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { User } from '../entities/user.entity';

export class UpdateMunicipalityUserDto
  implements UpdateMunicipalityUserDtoInterface
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
  implements CreateMunicipalityUserDtoInterface
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
  implements MunicipalityUserResponseDtoInterface
{
  data: User;
  success: boolean;
}

export class MunicipalityUsersResponseDto
  implements MunicipalityUsersResponseDtoInterface
{
  data: User[];
  success: boolean;
}

export class MunicipalityUserIdResponseDto
  implements MunicipalityUserIdResponseDtoInterface
{
  data: { id: string };
  success: boolean;
}
