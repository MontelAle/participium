import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SessionGuard } from '../auth/guards/session-auth.guard';
import { CategoriesService } from './categories.service';
import { CategoriesResponseDto } from './dto/category.dto';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(SessionGuard, RolesGuard)
@ApiCookieAuth('session_token')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Roles('tech_officer', 'user', 'pr_officer', 'admin')
  async findAll(): Promise<CategoriesResponseDto> {
    const categories = await this.categoriesService.findAll();
    return { success: true, data: categories };
  }
}
