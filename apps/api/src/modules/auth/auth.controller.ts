import {
  Post,
  Body,
  Controller,
  Request,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from '@repo/api';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { SessionGuard } from './guards/session-auth.guard';
import type { RequestWithUserSession } from '../../common/types/request-with-user-session.type';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: RequestWithUserSession,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, session, cookie } = await this.authService.login(
      req.user,
      req.ip,
      req.headers['user-agent'],
    );

    res.cookie('session_token', session.token, cookie);

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

    res.cookie('session_token', session.token, cookie);

    return { user, session };
  }

  @UseGuards(SessionGuard)
  @Post('logout')
  async logout(
    @Req() req: RequestWithUserSession,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionToken = req.cookies?.session_token;

    if (sessionToken) {
      await this.authService.logout(sessionToken);
    }

    res.clearCookie('session_token');

    return { message: 'Logout successful' };
  }
}
