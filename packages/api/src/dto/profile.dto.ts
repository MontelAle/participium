import { Profile } from 'entities/profile.entity';
import { ResponseDto } from './response.dto';

export interface UpdateProfileDto {
  telegramUsername?: string;
  emailNotificationsEnabled?: string;
}

export interface ProfileResponseDto extends ResponseDto {
  data: Profile;
}
