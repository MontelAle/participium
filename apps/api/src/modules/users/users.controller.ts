import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { SessionGuard } from '../auth/guards/session-auth.guard';
import { CreateMunicipalityUserDto } from '@repo/api';

@Controller('users')
@UseGuards(SessionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('municipality')
  async getMunicipalityUsers() {
    const users = await this.usersService.findMunicipalityUsers();
    return { success: true, data: users };
  }

  @Post('municipality')
  @HttpCode(HttpStatus.CREATED)
  async createMunicipalityUser(@Body() dto: CreateMunicipalityUserDto) {
    const user = await this.usersService.createMunicipalityUser(dto);
    return { success: true, data: user };
  }
}
