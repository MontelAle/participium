import { IsEmail, IsOptional, IsString } from 'class-validator';
import { User } from '../entities/user.entity';

export class UpdateMunicipalityUserDto {
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

export class CreateMunicipalityUserDto {
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
