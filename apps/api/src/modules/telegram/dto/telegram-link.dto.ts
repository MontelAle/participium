import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class TelegramLinkDto {
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  @Matches(/^[0-9]{6}$/, { message: 'Code must be a 6-digit number' })
  code: string;
}
