import {
  IsOptional,
  IsString,
  IsBoolean,
  Matches,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.telegramUsername !== '')
  @Matches(/^@[a-zA-Z0-9_]{4,31}$/, {
    message:
      'Telegram username must start with @ and contain 5-32 alphanumeric characters or underscores',
  })
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
