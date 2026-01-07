import { Report } from '@entities';
import { Injectable, Logger } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { CreateReportDto } from '../reports/dto/reports.dto';
import { ReportsService } from '../reports/reports.service';
import { TelegramAuthService } from './telegram-auth.service';
import { TelegramImageService } from './telegram-image.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private readonly reportsService: ReportsService,
    private readonly categoriesService: CategoriesService,
    private readonly telegramImageService: TelegramImageService,
    private readonly telegramAuthService: TelegramAuthService,
  ) {}

  async createReport(
    telegramId: string,
    reportData: {
      title: string;
      description: string;
      latitude: number;
      longitude: number;
      address?: string;
      categoryId: string;
      isAnonymous: boolean;
    },
    photoFileIds: string[],
  ): Promise<Report> {
    const userId = await this.telegramAuthService.getUserId(telegramId);

    if (!userId) {
      throw new Error('User not linked');
    }

    const images = await this.telegramImageService.downloadImages(photoFileIds);

    const createReportDto: CreateReportDto = {
      title: reportData.title,
      description: reportData.description,
      latitude: reportData.latitude,
      longitude: reportData.longitude,
      address: reportData.address,
      categoryId: reportData.categoryId,
      isAnonymous: reportData.isAnonymous,
    };

    const report = await this.reportsService.create(
      createReportDto,
      userId,
      images,
    );

    this.logger.log(
      `Report ${report.id} created via Telegram by user ${userId}`,
    );

    return report;
  }

  async getCategories() {
    return this.categoriesService.findAll();
  }
}
