import { User } from '../entities/user.entity';
import { ResponseDto } from './response.dto';

export interface UpdateMunicipalityUserDto {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
}

export interface CreateMunicipalityUserDto {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId: string;
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
