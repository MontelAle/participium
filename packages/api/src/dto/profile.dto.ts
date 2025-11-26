import { ResponseDto } from './response.dto';

export interface UpdateProfileDto {
  telegramUsername?: string;
  emailNotificationsEnabled?: string;
}

export interface UpdateProfileResponseDto extends ResponseDto {
  data: {
    id: string;
    telegramUsername: string | null;
    emailNotificationsEnabled: boolean;
    profilePictureUrl: string | null;
  };
}

export interface ProfileResponseDto extends ResponseDto {
  data: {
    id: string;
    telegramUsername: string | null;
    emailNotificationsEnabled: boolean;
    profilePictureUrl: string | null;
  };
}
