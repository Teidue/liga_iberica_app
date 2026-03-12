import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: (req: Request): string | null => {
        // 1. Ver Authorization header
        const authHeader = req?.headers?.authorization;
        if (authHeader) {
          return authHeader.replace(/^Bearer\s+/i, '').trim();
        }

        // 2. Ver query param
        const queryToken = req?.query?.['token'];
        if (typeof queryToken === 'string') {
          return queryToken.replace(/^Bearer\s+/i, '').trim();
        }

        return null;
      },
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ?? 'default_secret_key',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token inválido');
    }

    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      userId: user.id,
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      role: user.rol,
    };
  }
}
