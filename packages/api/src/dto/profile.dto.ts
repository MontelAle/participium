import { ResponseDto } from './response.dto';
import { User } from '../entities/user.entity';

export interface UpdateProfileDto {
  telegramUsername?: string;
  emailNotificationsEnabled?: string;
}

export interface ProfileResponseDto extends ResponseDto {
  data: User;
}
