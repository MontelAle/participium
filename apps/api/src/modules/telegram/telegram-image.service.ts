import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { BotContext } from './interfaces/bot-context.interface';

@Injectable()
export class TelegramImageService {
  constructor(@InjectBot() private readonly bot: Telegraf<BotContext>) {}

  async downloadImages(fileIds: string[]): Promise<Express.Multer.File[]> {
    const multerFiles: Express.Multer.File[] = [];

    for (const fileId of fileIds) {
      try {
        const file = await this.downloadImage(fileId);
        multerFiles.push(file);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        throw new InternalServerErrorException(
          `Failed to download image: ${errorMessage}`,
        );
      }
    }

    return multerFiles;
  }

  private async downloadImage(fileId: string): Promise<Express.Multer.File> {
    const fileLink = await this.bot.telegram.getFileLink(fileId);

    const response = await axios.get(fileLink.href, {
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(response.data);
    const mimetype = this.detectMimetype(buffer);
    const filename = this.extractFilename(fileLink.href);

    const multerFile: Express.Multer.File = {
      fieldname: 'images',
      originalname: filename,
      encoding: '7bit',
      mimetype: mimetype,
      buffer: buffer,
      size: buffer.length,
      stream: null,
      destination: null,
      filename: filename,
      path: null,
    };

    return multerFile;
  }

  private detectMimetype(buffer: Buffer): string {
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      return 'image/jpeg';
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50) {
      return 'image/png';
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49) {
      return 'image/gif';
    }
    return 'image/jpeg';
  }

  private extractFilename(url: string): string {
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    return filename || 'telegram-image.jpg';
  }
}
