import {
  Post,
  Body,
  Controller,
  Request,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from '@repo/api';
import { LocalAuthGuard } from './guards/local-auth.guard';
import type { RequestWithUserSession } from '../../common/types/request-with-user-session.type';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Request() req: RequestWithUserSession,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('Login attempt for user:', req.user.email);

    const { user, session, cookie } = await this.authService.login(
      req.user,
      req.ip,
      req.headers['user-agent'],
    );

    res.cookie('session_cookie', session.token, cookie);

    return { user, session };
  }

  @Post('register')
  async create(
    @Body() registerDto: RegisterDto,
    @Request() req: RequestWithUserSession,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user } = await this.authService.register(registerDto);

    const { session, cookie } = await this.authService.login(
      user,
      req.ip,
      req.headers['user-agent'],
    );

    res.cookie('session_cookie', session.token, cookie);

    return { user, session };
  }
}
