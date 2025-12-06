import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  LoginDto,
  LoginResponseDto,
  LogoutResponseDto,
  RegisterDto,
} from '../../common/dto/auth.dto';
import type { RequestWithUserSession } from '../../common/types/request-with-user-session.type';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { SessionGuard } from './guards/session-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Authenticates a user with username and password.
   *
   * @Remarks Returns user data and creates a session cookie.
   *
   * @throws {400} Validation error - Invalid input data
   * @throws {401} Unauthorized - Invalid username or password
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: RequestWithUserSession,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    if (!req.user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const { user, session, token } = await this.authService.login(
      req.user,
      req.ip,
      req.headers['user-agent'],
    );

    const cookieOptions = this.authService.getCookieOptions();

    res.cookie('session_token', token, cookieOptions);

    return { success: true, data: { user, session } };
  }

  /**
   * Creates a new user account and logs them in.
   *
   * @remarks  Creates a new user and account with user role. Automatically logs in the user after registration.
   *
   * @throws {409} Conflict
   * @throws {400} Validation error
   */
  @Post('register')
  async create(
    @Body() registerDto: RegisterDto,
    @Request() req: RequestWithUserSession,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { user } = await this.authService.register(registerDto);

    const { session, token } = await this.authService.login(
      user,
      req.ip,
      req.headers['user-agent'],
    );

    const cookieOptions = this.authService.getCookieOptions();

    res.cookie('session_token', token, cookieOptions);

    return { success: true, data: { user, session } };
  }

  /**
   * Logs out the current user by invalidating the session and clearing the session cookie.
   *
   * @throws {401} Unauthorized - Invalid or missing session
   */
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @Req() req: RequestWithUserSession,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponseDto> {
    const sessionToken = req.cookies?.session_token;

    await this.authService.logout(sessionToken);

    res.clearCookie('session_token');

    return { success: true };
  }

  /**
   * Refreshes the user session by extending its validity and updating the session cookie.
   *
   * @throws {401} Unauthorized - Invalid or missing session
   */
  @UseGuards(SessionGuard)
  @Post('refresh')
  async refresh(
    @Req() req: RequestWithUserSession,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { user } = req;

    const { session } = await this.authService.refreshSession(req.session);

    const cookieOptions = this.authService.getCookieOptions();
    const token = req.cookies.session_token;
    res.cookie('session_token', token, cookieOptions);

    return { success: true, data: { user, session } };
  }
}
