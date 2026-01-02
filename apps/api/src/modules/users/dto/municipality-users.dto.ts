import type { User, UserOfficeRole } from '@entities';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OfficeRoleAssignmentDto {
  @IsString()
  @IsNotEmpty()
  officeId: string;

  @IsString()
  @IsNotEmpty()
  roleId: string;
}

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

  /**
   * @deprecated Use officeRoleAssignments instead
   * Kept for backward compatibility
   */
  @IsString()
  @IsOptional()
  roleId?: string;

  /**
   * @deprecated Use officeRoleAssignments instead
   * Kept for backward compatibility
   */
  @IsString()
  @IsOptional()
  officeId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfficeRoleAssignmentDto)
  @IsOptional()
  officeRoleAssignments?: OfficeRoleAssignmentDto[];
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

  /**
   * @deprecated Use officeRoleAssignments instead
   * Kept for backward compatibility - if provided, creates single assignment
   */
  @IsString()
  @IsOptional()
  roleId?: string;

  /**
   * @deprecated Use officeRoleAssignments instead
   * Kept for backward compatibility
   */
  @IsString()
  @IsOptional()
  officeId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfficeRoleAssignmentDto)
  @IsOptional()
  officeRoleAssignments?: OfficeRoleAssignmentDto[];
}

export class UserOfficeRolesResponseDto {
  data: UserOfficeRole[];
  success: boolean;
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
