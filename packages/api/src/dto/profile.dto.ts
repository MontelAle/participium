import { IsOptional, IsString, Matches, ValidateIf } from 'class-validator';
import { Profile } from '../entities/profile.entity';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.telegramUsername !== '')
  @Matches(/^@[a-zA-Z0-9_]{4,31}$/, {
    message:
      'Telegram username must start with @ and contain 5-32 alphanumeric characters or underscores',
  })
  telegramUsername?: string;

  @IsString()
  @IsOptional()
  emailNotificationsEnabled?: string;
}

export class ProfileResponseDto {
  success: boolean;
  data: Profile;
}
