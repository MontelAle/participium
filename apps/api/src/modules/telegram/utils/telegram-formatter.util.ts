import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramFormatterUtil {
  constructor(private readonly configService: ConfigService) {}

  isLocalhost(url: string): boolean {
    return url.includes('localhost') || url.includes('127.0.0.1');
  }

  formatLinkMessage(text: string, url: string, label: string): string {
    if (this.isLocalhost(url)) {
      return `${text}\n\n👉 <b>${label}:</b>\n<code>${url}</code>`;
    }

    return `${text}\n\n<a href="${url}">${label}</a>`;
  }

  getFrontendUrl(path = ''): string {
    const baseUrl = this.configService.get<string>('app.frontendUrl');
    const cleanBase = baseUrl.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    return path ? `${cleanBase}/${cleanPath}` : cleanBase;
  }
}
