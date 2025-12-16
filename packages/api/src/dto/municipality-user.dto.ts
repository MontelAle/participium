import { User } from '@entities';
import { ResponseDto } from './response.dto';

export interface UpdateMunicipalityUserDto {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  officeId?: string;
}

export interface CreateMunicipalityUserDto {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId: string;
  officeId?: string;
}

export interface MunicipalityUserResponseDto extends ResponseDto {
  data: User;
}

export interface MunicipalityUsersResponseDto extends ResponseDto {
  data: User[];
}

export interface MunicipalityUserIdResponseDto extends ResponseDto {
  data: { id: string };
}
