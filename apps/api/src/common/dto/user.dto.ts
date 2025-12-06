import {
  IsOptional,
  IsString,
  IsBoolean,
  Matches,
  ValidateIf,
  IsEmail,
  IsNotEmpty,
} from 'class-validator';
import {
  UpdateProfileDto as UpdateProfileDtoInterface,
  ProfileResponseDto as ProfileResponseDtoInterface,
} from '@repo/api';
import { Profile } from '../entities/profile.entity';

export class UpdateProfileDto implements UpdateProfileDtoInterface {
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

export class ProfileResponseDto implements ProfileResponseDtoInterface {
  success: boolean;
  data: Profile;
}
