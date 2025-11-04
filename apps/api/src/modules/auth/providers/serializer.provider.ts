import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { User } from '@repo/api';
import { AuthService } from '../auth.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly authService: AuthService) {
    super();
  }

  serializeUser(user: User, done: (err: any, id?: string) => void) {
    done(null, user.id);
  }

  async deserializeUser(id: string, done: (err: any, user?: any) => void) {
    const user = await this.authService.findUserById(id);
    if (!user) return done(null, false);
    done(null, user);
  }
}
