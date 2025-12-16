import { Profile } from '../entities/profile.entity';
import { ResponseDto } from './response.dto';

export interface UpdateProfileDto {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  telegramUsername?: string;
  emailNotificationsEnabled?: string;
}

export interface ProfileResponseDto extends ResponseDto {
  data: Profile;
}
