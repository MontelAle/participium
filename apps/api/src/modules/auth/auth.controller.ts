import {
  Post,
  Body,
  Controller,
  Request,
  UseGuards,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from '../../common/dto/auth.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { SessionGuard } from './guards/session-auth.guard';
import type { RequestWithUserSession } from '../../common/types/request-with-user-session.type';
import type { Response } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Authenticates a user with username and password.
   *
   * @Remarks Returns user data and creates a session cookie.
   *
   * @returns {200} Login successful - Session cookie set
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
  ) {
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
   * @throws {201} Registration successful
   * @throws {409} Conflict
   * @throws {400} Validation error
   */
  @Post('register')
  async create(
    @Body() registerDto: RegisterDto,
    @Request() req: RequestWithUserSession,
    @Res({ passthrough: true }) res: Response,
  ) {
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
   *
   * @throws {200}Logout successful - Session invalidated
   * @throws {401} Unauthorized - Invalid or missing session
   *
   */
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @Req() req: RequestWithUserSession,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionToken = req.cookies?.session_token;

    await this.authService.logout(sessionToken);

    res.clearCookie('session_token');

    return { success: true };
  }

  @UseGuards(SessionGuard)
  @Post('refresh')
  async refresh(
    @Req() req: RequestWithUserSession,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user } = req;

    const { session } = await this.authService.refreshSession(req.session);

    const cookieOptions = this.authService.getCookieOptions();
    const token = req.cookies.session_token;
    res.cookie('session_token', token, cookieOptions);

    return { success: true, data: { user, session } };
  }
}
