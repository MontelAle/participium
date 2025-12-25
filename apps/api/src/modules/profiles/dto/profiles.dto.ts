import type { Profile } from '@entities';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.telegramUsername !== '' && o.telegramUsername !== null)
  @Matches(/^@\w{4,31}$/, {
    message:
      'Telegram username must start with @ and contain 5-32 alphanumeric characters or underscores',
  })
  telegramUsername?: string;

  @IsString()
  @IsOptional()
  emailNotificationsEnabled?: string;

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
}

export class ProfileResponseDto {
  success: boolean;
  data: Profile;
}
