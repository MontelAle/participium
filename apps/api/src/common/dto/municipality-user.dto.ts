import { IsOptional, IsString, IsEmail } from 'class-validator';
import {
  UpdateMunicipalityUserDto as UpdateMunicipalityUserDtoInterface,
  CreateMunicipalityUserDto as CreateMunicipalityUserDtoInterface,
  MunicipalityUserResponseDto as MunicipalityUserResponseDtoInterface,
  MunicipalityUsersResponseDto as MunicipalityUsersResponseDtoInterface,
  MunicipalityUserIdResponseDto as MunicipalityUserIdResponseDtoInterface,
} from '@repo/api';
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
