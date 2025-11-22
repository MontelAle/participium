import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { SessionGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesResponseDto } from '../../common/dto/role.dto';
import { CategoriesResponseDto } from '../../common/dto/category.dto';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(SessionGuard , RolesGuard)
@ApiCookieAuth('session_token')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Roles('officier', 'user','municipal_pr_officer') 
  async findAll(): Promise<CategoriesResponseDto> {
    const categories = await this.categoriesService.findAll();
    return { success: true, data: categories };
  }
}

