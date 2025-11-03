import { Post, Body, Controller, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from 'src/common/dto/register.dto';
import { promisify } from 'util';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async create(@Body() registerDto: RegisterDto, @Request() req) {
    const { user } = await this.authService.register(registerDto);

    await promisify(req.login).call(req, user);

    req.session.ipAddress = req.ip;
    req.session.userAgent = req.headers['user-agent'];

    return { user };
  }
}
