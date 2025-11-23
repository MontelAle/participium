import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  telegramUsername?: string;

  @IsBoolean()
  @IsOptional()
  emailNotificationsEnabled?: boolean;
}

export class UpdateProfileResponseDto {
  success: boolean;
  data: {
    id: string;
    telegramUsername: string | null;
    emailNotificationsEnabled: boolean;
    profilePictureUrl: string | null;
  };
}
