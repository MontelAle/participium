import { Post, Body, Controller, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from '@repo/api';
import { promisify } from 'util';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    await promisify(req.login).call(req, req.user);

    const user = req.user;
    req.session.ipAddress = req.ip;
    req.session.userAgent = req.headers['user-agent'];
    return { user, session: req.session };
  }

  @Post('register')
  async create(@Body() registerDto: RegisterDto, @Request() req) {
    const { user } = await this.authService.register(registerDto);

    await promisify(req.login).call(req, user);

    req.session.ipAddress = req.ip;
    req.session.userAgent = req.headers['user-agent'];

    return { user, session: req.session };
  }
}
