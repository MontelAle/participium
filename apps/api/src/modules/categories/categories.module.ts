import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../../common/entities/category.entity';
import { Session } from '../../common/entities/session.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Session])],
  controllers: [CategoriesController],
  providers: [CategoriesService, RolesGuard],
})
export class CategoriesModule {}
