import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { SignJWT, jwtVerify, importPKCS8, importSPKI, JWTPayload, KeyLike } from 'jose';
import { PrismaService } from '../prisma/prisma.service';

export type AccessTokenPayload = JWTPayload & {
  sub: string;
  email: string;
  tokenVersion: number;
};

@Injectable()
export class JwtService {
  private privateKeyPromise?: Promise<KeyLike>;
  private publicKeyPromise?: Promise<KeyLike>;
  private readonly accessExpires: string;
  private readonly refreshExpires: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.accessExpires = this.configService.get<string>('JWT_ACCESS_EXPIRES', '15m');
    this.refreshExpires = this.configService.get<string>('JWT_REFRESH_EXPIRES', '7d');
  }

  async generateAccessToken(payload: { sub: string; email: string; tokenVersion: number }): Promise<string> {
    const key = await this.getPrivateKey();
    return new SignJWT({ email: payload.email, tokenVersion: payload.tokenVersion })
      .setProtectedHeader({ alg: 'RS256' })
      .setSubject(payload.sub)
      .setIssuedAt()
      .setExpirationTime(this.accessExpires)
      .sign(key);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const key = await this.getPublicKey();
    const { payload } = await jwtVerify(token, key, { algorithms: ['RS256'] });
    return payload as AccessTokenPayload;
  }

  async generateRefreshToken(userId: string, deviceInfo?: string): Promise<string> {
    const token = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = this.calculateExpiryDate(this.refreshExpires);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        deviceInfo,
        expiresAt,
      },
    });

    return token;
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async getPrivateKey(): Promise<KeyLike> {
    if (!this.privateKeyPromise) {
      const rawKey = this.normalizeKey(this.configService.get<string>('JWT_PRIVATE_KEY'));
      this.privateKeyPromise = importPKCS8(rawKey, 'RS256');
    }
    return this.privateKeyPromise;
  }

  private async getPublicKey(): Promise<KeyLike> {
    if (!this.publicKeyPromise) {
      const rawKey = this.normalizeKey(this.configService.get<string>('JWT_PUBLIC_KEY'));
      this.publicKeyPromise = importSPKI(rawKey, 'RS256');
    }
    return this.publicKeyPromise;
  }

  private normalizeKey(value?: string): string {
    if (!value) {
      throw new InternalServerErrorException('JWT key is not configured');
    }
    return value.replace(/\\n/g, '\n');
  }

  private calculateExpiryDate(duration: string): Date {
    const ms = this.parseDurationToMs(duration);
    return new Date(Date.now() + ms);
  }

  private parseDurationToMs(value: string): number {
    const match = value.trim().match(/^(\d+)([smhd])$/i);
    if (!match) {
      throw new InternalServerErrorException(`Invalid duration format: ${value}`);
    }

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multiplier =
      unit === 's'
        ? 1000
        : unit === 'm'
          ? 60 * 1000
          : unit === 'h'
            ? 60 * 60 * 1000
            : 24 * 60 * 60 * 1000;

    return amount * multiplier;
  }
}
