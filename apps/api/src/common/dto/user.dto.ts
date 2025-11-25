import {
  IsOptional,
  IsString,
  IsBoolean,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  UpdateProfileDto as UpdateProfileDtoInterface,
  UpdateProfileResponseDto as UpdateProfileResponseDtoInterface,
} from '@repo/api';

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
}

export class UpdateProfileResponseDto
  implements UpdateProfileResponseDtoInterface
{
  success: boolean;
  data: {
    id: string;
    telegramUsername: string | null;
    emailNotificationsEnabled: boolean;
    profilePictureUrl: string | null;
  };
}
