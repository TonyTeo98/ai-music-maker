import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, IdentityProvider, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from './jwt.service';
import { EmailService } from '../email/email.service';
import { GoogleProfile } from './strategies/google.strategy';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

@Injectable()
export class AuthService {
  private readonly saltRounds = 12;
  private readonly maxFailedLogins = 5;
  private readonly lockDurationMs = 15 * 60 * 1000;
  private readonly emailVerificationTtlMs = 24 * 60 * 60 * 1000;
  private readonly passwordResetTtlMs = 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(email: string, password: string, deviceInfo?: string) {
    const normalizedEmail = this.normalizeEmail(email);
    this.assertPasswordValid(password);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, this.saltRounds);

    let user: User;
    try {
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          identities: {
            create: {
              provider: IdentityProvider.email,
              providerId: normalizedEmail,
              passwordHash,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }

    const verificationToken = await this.issueEmailVerification(normalizedEmail);
    await this.emailService.sendVerificationEmail(normalizedEmail, verificationToken);

    const refreshToken = await this.jwtService.generateRefreshToken(user.id, deviceInfo);
    return this.buildAuthResponse(user, refreshToken);
  }

  async login(email: string, password: string, deviceInfo?: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const identity = await this.prisma.identity.findUnique({
      where: {
        provider_providerId: {
          provider: IdentityProvider.email,
          providerId: normalizedEmail,
        },
      },
      include: { user: true },
    });

    if (!identity || !identity.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const now = new Date();
    if (identity.lockedUntil && identity.lockedUntil > now) {
      throw new UnauthorizedException('Account is temporarily locked');
    }

    if (identity.lockedUntil && identity.lockedUntil <= now) {
      await this.prisma.identity.update({
        where: { id: identity.id },
        data: { failedLoginCount: 0, lockedUntil: null },
      });
      identity.failedLoginCount = 0;
      identity.lockedUntil = null;
    }

    const passwordValid = await bcrypt.compare(password, identity.passwordHash);

    if (!passwordValid) {
      await this.recordFailedLogin(identity);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (identity.failedLoginCount !== 0 || identity.lockedUntil) {
      await this.prisma.identity.update({
        where: { id: identity.id },
        data: { failedLoginCount: 0, lockedUntil: null },
      });
    }

    const refreshToken = await this.jwtService.generateRefreshToken(identity.userId, deviceInfo);
    return this.buildAuthResponse(identity.user, refreshToken);
  }

  async refresh(refreshToken: string, deviceInfo?: string) {
    const tokenHash = this.jwtService.hashToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    const now = new Date();

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt <= now) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: now },
    });

    const newRefreshToken = await this.jwtService.generateRefreshToken(
      storedToken.userId,
      deviceInfo,
    );

    return this.buildAuthResponse(storedToken.user, newRefreshToken);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.jwtService.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  async logoutAll(userId: string) {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
      }),
    ]);

    return { success: true };
  }

  async loginWithGoogle(profile: GoogleProfile, deviceInfo?: string) {
    const normalizedEmail = this.normalizeEmail(profile.email);
    const existingIdentity = await this.prisma.identity.findUnique({
      where: {
        provider_providerId: {
          provider: IdentityProvider.google,
          providerId: profile.providerId,
        },
      },
      include: { user: true },
    });

    if (existingIdentity) {
      const user = await this.ensureGoogleProfile(existingIdentity.user, profile);
      const refreshToken = await this.jwtService.generateRefreshToken(user.id, deviceInfo);
      return this.buildAuthResponse(user, refreshToken);
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      await this.prisma.identity.create({
        data: {
          provider: IdentityProvider.google,
          providerId: profile.providerId,
          userId: existingUser.id,
        },
      });

      const user = await this.ensureGoogleProfile(existingUser, profile);
      const refreshToken = await this.jwtService.generateRefreshToken(user.id, deviceInfo);
      return this.buildAuthResponse(user, refreshToken);
    }

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        emailVerified: true,
        nickname: profile.nickname ?? null,
        avatar: profile.avatar ?? null,
        identities: {
          create: {
            provider: IdentityProvider.google,
            providerId: profile.providerId,
          },
        },
      },
    });

    const refreshToken = await this.jwtService.generateRefreshToken(user.id, deviceInfo);
    return this.buildAuthResponse(user, refreshToken);
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerification.findUnique({
      where: { token },
    });

    const now = new Date();
    if (!record || record.usedAt || record.expiresAt <= now) {
      throw new BadRequestException('Invalid or expired token');
    }

    const email = this.normalizeEmail(record.email);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerification.updateMany({
        where: { email, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      }),
    ]);

    return { success: true };
  }

  async resendVerification(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || user.emailVerified) {
      return { success: true };
    }

    const token = await this.issueEmailVerification(normalizedEmail);
    await this.emailService.sendVerificationEmail(normalizedEmail, token);
    return { success: true };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return { success: true };
    }

    const identity = await this.prisma.identity.findUnique({
      where: {
        provider_providerId: {
          provider: IdentityProvider.email,
          providerId: normalizedEmail,
        },
      },
    });

    if (!identity) {
      return { success: true };
    }

    const token = await this.issuePasswordReset(normalizedEmail);
    await this.emailService.sendPasswordResetEmail(normalizedEmail, token);
    return { success: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await this.prisma.passwordReset.findUnique({
      where: { token },
    });

    const now = new Date();
    if (!record || record.usedAt || record.expiresAt <= now) {
      throw new BadRequestException('Invalid or expired token');
    }

    const email = this.normalizeEmail(record.email);
    const identity = await this.prisma.identity.findUnique({
      where: {
        provider_providerId: {
          provider: IdentityProvider.email,
          providerId: email,
        },
      },
    });

    if (!identity) {
      throw new BadRequestException('Invalid or expired token');
    }

    this.assertPasswordValid(newPassword);
    const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);

    await this.prisma.$transaction([
      this.prisma.passwordReset.updateMany({
        where: { email, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.identity.update({
        where: { id: identity.id },
        data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
      }),
    ]);

    return { success: true };
  }

  private async ensureGoogleProfile(user: User, profile: GoogleProfile): Promise<User> {
    const updates: Prisma.UserUpdateInput = {};

    if (!user.emailVerified) {
      updates.emailVerified = true;
    }

    if (!user.nickname && profile.nickname) {
      updates.nickname = profile.nickname;
    }

    if (!user.avatar && profile.avatar) {
      updates.avatar = profile.avatar;
    }

    if (Object.keys(updates).length === 0) {
      return user;
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: updates,
    });
  }

  private async issueEmailVerification(email: string): Promise<string> {
    const normalizedEmail = this.normalizeEmail(email);
    const token = this.generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.emailVerificationTtlMs);

    await this.prisma.$transaction([
      this.prisma.emailVerification.updateMany({
        where: { email: normalizedEmail, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.emailVerification.create({
        data: {
          email: normalizedEmail,
          token,
          expiresAt,
        },
      }),
    ]);

    return token;
  }

  private async issuePasswordReset(email: string): Promise<string> {
    const normalizedEmail = this.normalizeEmail(email);
    const token = this.generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.passwordResetTtlMs);

    await this.prisma.$transaction([
      this.prisma.passwordReset.updateMany({
        where: { email: normalizedEmail, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.passwordReset.create({
        data: {
          email: normalizedEmail,
          token,
          expiresAt,
        },
      }),
    ]);

    return token;
  }

  private generateToken(bytes = 32): string {
    return randomBytes(bytes).toString('hex');
  }

  private assertPasswordValid(password: string) {
    if (!PASSWORD_REGEX.test(password)) {
      throw new BadRequestException('Password must be at least 8 characters and include letters and numbers');
    }
  }

  private async buildAuthResponse(user: User, refreshToken: string) {
    const accessToken = await this.jwtService.generateAccessToken({
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    });

    return {
      accessToken,
      refreshToken,
      user: this.buildUserResponse(user),
    };
  }

  private buildUserResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname ?? undefined,
      avatar: user.avatar ?? undefined,
      bio: user.bio ?? undefined,
      emailVerified: user.emailVerified,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async recordFailedLogin(identity: { id: string; failedLoginCount: number }) {
    const nextCount = identity.failedLoginCount + 1;
    const data: Prisma.IdentityUpdateInput = { failedLoginCount: nextCount };

    if (nextCount >= this.maxFailedLogins) {
      data.lockedUntil = new Date(Date.now() + this.lockDurationMs);
    }

    await this.prisma.identity.update({
      where: { id: identity.id },
      data,
    });
  }
}
