import { IsOptional, IsString, IsEmail } from 'class-validator';
import { UpdateMunicipalityUserDto as UpadteMunicipalityUserDtoInterface } from '@repo/api';
import { CreateMunicipalityUserDto as CreateMunicipalityUserDtoInterface } from '@repo/api';

export class UpdateMunicipalityUserDto
  implements UpadteMunicipalityUserDtoInterface
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
