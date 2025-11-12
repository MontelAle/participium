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
import { RegisterDto, LoginDto } from '@repo/api';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { SessionGuard } from './guards/session-auth.guard';
import type { RequestWithUserSession } from '../../common/types/request-with-user-session.type';
import type { Response } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: `Authenticates a user with username and password.
                  Returns user data and creates a session cookie.
                  **Access:** Public`,
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      validLogin: {
        summary: 'Valid login credentials',
        value: {
          username: 'user@example.com',
          password: 'SecurePass123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful - Session cookie set',
    schema: {
      example: {
        success: true,
        data: {
          user: {
            id: 1,
            email: 'user@example.com',
            username: 'john_doe',
            firstName: 'John',
            lastName: 'Doe',
          },
          session: {
            token: 'session_token_value',
            expiresAt: '2024-01-01T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error - Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'Invalid username format',
          'Password must be at least 6 characters',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: RequestWithUserSession,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('Invalid credentials');
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

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'User registration',
    description: `Creates a new user account with citizen role.
                  Automatically logs in the user after registration.
                  **Access:** Public`,
  })
  @ApiBody({
    type: RegisterDto,
    examples: {
      validRegistration: {
        summary: 'Valid registration data',
        value: {
          email: 'newuser@example.com',
          username: 'new_user',
          firstName: 'Jane',
          lastName: 'Smith',
          password: 'SecurePass123',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Registration successful - User created and logged in',
    schema: {
      example: {
        success: true,
        data: {
          user: {
            id: 2,
            email: 'newuser@example.com',
            username: 'new_user',
            firstName: 'Jane',
            lastName: 'Smith',
          },
          session: {
            token: 'session_token_value',
            expiresAt: '2024-01-01T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error - Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'Invalid username format',
          'Username is required',
          'Password must be at least 6 characters',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User with this username already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'User with this username already exists',
        error: 'Conflict',
      },
    },
  })
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

  @UseGuards(SessionGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('session_token')
  @ApiOperation({
    summary: 'User logout',
    description: `Invalidates the current session and clears the session cookie.
                  **Access:** Requires valid session`,
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful - Session invalidated',
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing session',
    schema: {
      example: {
        statusCode: 401,
        message: 'No session token',
        error: 'Unauthorized',
      },
    },
  })
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
