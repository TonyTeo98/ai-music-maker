import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { IdentityProvider, Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

type MockedPrismaService = PrismaService & {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  identity: {
    findUnique: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
  };
  refreshToken: {
    findUnique: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
    create: jest.Mock;
  };
  emailVerification: {
    findUnique: jest.Mock;
    updateMany: jest.Mock;
    create: jest.Mock;
  };
  passwordReset: {
    findUnique: jest.Mock;
    updateMany: jest.Mock;
    create: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockedPrismaService;
  let jwtService: jest.Mocked<JwtService>;
  let emailService: jest.Mocked<EmailService>;

  const baseUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    nickname: null,
    avatar: null,
    bio: null,
    emailVerified: false,
    tokenVersion: 0,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const buildIdentity = (overrides: Partial<any> = {}) => ({
    id: 'identity-1',
    provider: IdentityProvider.email,
    providerId: baseUser.email,
    passwordHash: 'hashed-password',
    failedLoginCount: 0,
    lockedUntil: null,
    userId: baseUser.id,
    user: baseUser,
    ...overrides,
  });

  const buildUser = (overrides: Partial<User> = {}): User => ({
    ...baseUser,
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      identity: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      emailVerification: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      passwordReset: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    } as unknown as MockedPrismaService;

    jwtService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      hashToken: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    emailService = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    } as unknown as jest.Mocked<EmailService>;

    service = new AuthService(prisma, jwtService, emailService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('registers a new user and returns auth response', async () => {
      const user = buildUser({ email: 'test@example.com' });
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(user);
      prisma.emailVerification.updateMany.mockResolvedValue({ count: 0 } as any);
      prisma.emailVerification.create.mockResolvedValue({ id: 'verify-1' } as any);
      jwtService.generateRefreshToken.mockResolvedValue('refresh-token');
      jwtService.generateAccessToken.mockResolvedValue('access-token');
      (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue('hash');

      const result = await service.register('Test@Example.com', 'Password1', 'device');

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
            identities: expect.any(Object),
          }),
        }),
      );
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      );
      expect(jwtService.generateRefreshToken).toHaveBeenCalledWith('user-1', 'device');
      expect(jwtService.generateAccessToken).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
        tokenVersion: 0,
      });
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          nickname: undefined,
          avatar: undefined,
          bio: undefined,
          emailVerified: false,
        },
      });
    });

    it('throws ConflictException for duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());

      await expect(service.register('test@example.com', 'Password1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException when prisma unique constraint fails', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue('hash');
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.register('test@example.com', 'Password1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('rethrows unexpected prisma errors', async () => {
      const error = new Error('Unexpected failure');
      prisma.user.findUnique.mockResolvedValue(null);
      (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue('hash');
      prisma.user.create.mockRejectedValue(error);

      await expect(service.register('test@example.com', 'Password1')).rejects.toThrow(error);
    });

    it('throws BadRequestException for weak password', async () => {
      await expect(service.register('test@example.com', 'weak')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    it('logs in successfully', async () => {
      const identity = buildIdentity({ failedLoginCount: 2 });
      prisma.identity.findUnique.mockResolvedValue(identity);
      prisma.identity.update.mockResolvedValue(identity);
      jwtService.generateRefreshToken.mockResolvedValue('refresh-token');
      jwtService.generateAccessToken.mockResolvedValue('access-token');
      (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValue(true);

      const result = await service.login('Test@Example.com', 'Password1', 'device');

      expect(jwtService.generateRefreshToken).toHaveBeenCalledWith('user-1', 'device');
      expect(prisma.identity.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { failedLoginCount: 0, lockedUntil: null },
        }),
      );
      expect(result.user.email).toBe('test@example.com');
    });

    it('clears expired lockout before checking password', async () => {
      const identity = buildIdentity({
        failedLoginCount: 3,
        lockedUntil: new Date(Date.now() - 60_000),
      });
      prisma.identity.findUnique.mockResolvedValue(identity);
      prisma.identity.update.mockResolvedValue(identity);
      jwtService.generateRefreshToken.mockResolvedValue('refresh-token');
      jwtService.generateAccessToken.mockResolvedValue('access-token');
      (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValue(true);

      await service.login('Test@Example.com', 'Password1');

      expect(prisma.identity.update).toHaveBeenCalledWith({
        where: { id: identity.id },
        data: { failedLoginCount: 0, lockedUntil: null },
      });
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const identity = buildIdentity();
      prisma.identity.findUnique.mockResolvedValue(identity);
      (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValue(false);
      prisma.identity.update.mockResolvedValue(identity);

      await expect(service.login('test@example.com', 'BadPass1')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.identity.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedLoginCount: 1 }),
        }),
      );
    });

    it('locks account after max failed attempts', async () => {
      const identity = buildIdentity({ failedLoginCount: 4 });
      prisma.identity.findUnique.mockResolvedValue(identity);
      prisma.identity.update.mockResolvedValue(identity);
      (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValue(false);

      await expect(service.login('test@example.com', 'BadPass1')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(prisma.identity.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginCount: 5,
            lockedUntil: expect.any(Date),
          }),
        }),
      );
    });

    it('throws UnauthorizedException when locked out', async () => {
      const identity = buildIdentity({ lockedUntil: new Date(Date.now() + 60_000) });
      prisma.identity.findUnique.mockResolvedValue(identity);
      const compareSpy = jest.spyOn(bcrypt, 'compare') as jest.Mock;

      await expect(service.login('test@example.com', 'Password1')).rejects.toThrow(
        'Account is temporarily locked',
      );
      expect(compareSpy).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when user not found', async () => {
      prisma.identity.findUnique.mockResolvedValue(null);

      await expect(service.login('test@example.com', 'Password1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('rotates refresh token and returns new auth response', async () => {
      const user = buildUser({ emailVerified: true });
      const storedToken = {
        id: 'refresh-1',
        userId: user.id,
        tokenHash: 'hash',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user,
      };

      jwtService.hashToken.mockReturnValue('hash');
      prisma.refreshToken.findUnique.mockResolvedValue(storedToken as any);
      prisma.refreshToken.update.mockResolvedValue(storedToken as any);
      jwtService.generateRefreshToken.mockResolvedValue('new-refresh');
      jwtService.generateAccessToken.mockResolvedValue('access-token');

      const result = await service.refresh('refresh-token', 'device');

      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { revokedAt: expect.any(Date) },
        }),
      );
      expect(jwtService.generateRefreshToken).toHaveBeenCalledWith('user-1', 'device');
      expect(result.refreshToken).toBe('new-refresh');
    });

    it('throws UnauthorizedException for revoked token', async () => {
      const storedToken = {
        id: 'refresh-1',
        userId: baseUser.id,
        tokenHash: 'hash',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        user: baseUser,
      };

      jwtService.hashToken.mockReturnValue('hash');
      prisma.refreshToken.findUnique.mockResolvedValue(storedToken as any);

      await expect(service.refresh('refresh-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for expired token', async () => {
      const storedToken = {
        id: 'refresh-1',
        userId: baseUser.id,
        tokenHash: 'hash',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1_000),
        user: baseUser,
      };

      jwtService.hashToken.mockReturnValue('hash');
      prisma.refreshToken.findUnique.mockResolvedValue(storedToken as any);

      await expect(service.refresh('refresh-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when token is missing', async () => {
      jwtService.hashToken.mockReturnValue('hash');
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('refresh-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('revokes refresh token', async () => {
      jwtService.hashToken.mockReturnValue('hash');
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 } as any);

      const result = await service.logout('refresh-token');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { tokenHash: 'hash', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('logoutAll', () => {
    it('revokes all tokens and increments tokenVersion', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 } as any);
      prisma.user.update.mockResolvedValue(buildUser({ tokenVersion: 1 }));

      const result = await service.logoutAll('user-1');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { tokenVersion: { increment: 1 } },
      });
      expect(prisma.$transaction).toHaveBeenCalledWith([
        expect.any(Promise),
        expect.any(Promise),
      ]);
      expect(result).toEqual({ success: true });
    });
  });

  describe('verifyEmail', () => {
    it('verifies email when token is valid', async () => {
      prisma.emailVerification.findUnique.mockResolvedValue({
        id: 'verify-1',
        email: baseUser.email,
        token: 'token',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      } as any);
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.emailVerification.updateMany.mockResolvedValue({ count: 1 } as any);
      prisma.user.update.mockResolvedValue(buildUser({ emailVerified: true }));

      const result = await service.verifyEmail('token');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('throws BadRequestException for invalid token', async () => {
      prisma.emailVerification.findUnique.mockResolvedValue(null);

      await expect(service.verifyEmail('token')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when token user is missing', async () => {
      prisma.emailVerification.findUnique.mockResolvedValue({
        id: 'verify-1',
        email: baseUser.email,
        token: 'token',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      } as any);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.verifyEmail('token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendVerification', () => {
    it('returns success when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.resendVerification('test@example.com');

      expect(result).toEqual({ success: true });
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('resends verification email when user is unverified', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser({ emailVerified: false }));
      prisma.emailVerification.updateMany.mockResolvedValue({ count: 1 } as any);
      prisma.emailVerification.create.mockResolvedValue({ id: 'verify-1' } as any);

      const result = await service.resendVerification('Test@Example.com');

      expect(prisma.emailVerification.updateMany).toHaveBeenCalled();
      expect(prisma.emailVerification.create).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('forgotPassword', () => {
    it('returns success when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('test@example.com');

      expect(result).toEqual({ success: true });
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('returns success when identity does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      prisma.identity.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('test@example.com');

      expect(result).toEqual({ success: true });
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('issues password reset when identity exists', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      prisma.identity.findUnique.mockResolvedValue(buildIdentity());
      prisma.passwordReset.updateMany.mockResolvedValue({ count: 1 } as any);
      prisma.passwordReset.create.mockResolvedValue({ id: 'reset-1' } as any);

      const result = await service.forgotPassword('Test@Example.com');

      expect(prisma.passwordReset.updateMany).toHaveBeenCalled();
      expect(prisma.passwordReset.create).toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('resetPassword', () => {
    it('resets password when token is valid', async () => {
      prisma.passwordReset.findUnique.mockResolvedValue({
        id: 'reset-1',
        email: baseUser.email,
        token: 'token',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      } as any);
      prisma.identity.findUnique.mockResolvedValue(buildIdentity());
      prisma.passwordReset.updateMany.mockResolvedValue({ count: 1 } as any);
      prisma.identity.update.mockResolvedValue(buildIdentity({ passwordHash: 'new-hash' }));
      (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue('new-hash');

      const result = await service.resetPassword('token', 'Newpass1');

      expect(prisma.identity.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passwordHash: 'new-hash',
            failedLoginCount: 0,
            lockedUntil: null,
          }),
        }),
      );
      expect(result).toEqual({ success: true });
    });

    it('throws BadRequestException for invalid token', async () => {
      prisma.passwordReset.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword('token', 'Newpass1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when identity is missing', async () => {
      prisma.passwordReset.findUnique.mockResolvedValue({
        id: 'reset-1',
        email: baseUser.email,
        token: 'token',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      } as any);
      prisma.identity.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword('token', 'Newpass1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('loginWithGoogle', () => {
    const profile = {
      providerId: 'google-123',
      email: 'Test@Example.com',
      nickname: 'Tester',
      avatar: 'https://example.com/avatar.png',
    };

    it('logs in when identity exists and updates profile fields', async () => {
      const user = buildUser({ emailVerified: false, nickname: null, avatar: null });
      prisma.identity.findUnique.mockResolvedValue({
        id: 'identity-google',
        provider: IdentityProvider.google,
        providerId: profile.providerId,
        userId: user.id,
        user,
        failedLoginCount: 0,
        lockedUntil: null,
      } as any);
      prisma.user.update.mockResolvedValue(
        buildUser({ emailVerified: true, nickname: profile.nickname, avatar: profile.avatar }),
      );
      jwtService.generateRefreshToken.mockResolvedValue('refresh-token');
      jwtService.generateAccessToken.mockResolvedValue('access-token');

      const result = await service.loginWithGoogle(profile, 'device');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: {
          emailVerified: true,
          nickname: profile.nickname,
          avatar: profile.avatar,
        },
      });
      expect(result.user.emailVerified).toBe(true);
    });

    it('links google identity to existing user without profile updates', async () => {
      const user = buildUser({
        emailVerified: true,
        nickname: 'Existing',
        avatar: 'https://example.com/existing.png',
      });
      prisma.identity.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.identity.create.mockResolvedValue({ id: 'identity-google' } as any);
      jwtService.generateRefreshToken.mockResolvedValue('refresh-token');
      jwtService.generateAccessToken.mockResolvedValue('access-token');

      const result = await service.loginWithGoogle(profile);

      expect(prisma.identity.create).toHaveBeenCalledWith({
        data: {
          provider: IdentityProvider.google,
          providerId: profile.providerId,
          userId: user.id,
        },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(result.user.email).toBe('test@example.com');
    });

    it('creates a new user when none exists', async () => {
      const user = buildUser({
        emailVerified: true,
        nickname: profile.nickname,
        avatar: profile.avatar,
      });
      prisma.identity.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(user);
      jwtService.generateRefreshToken.mockResolvedValue('refresh-token');
      jwtService.generateAccessToken.mockResolvedValue('access-token');

      const result = await service.loginWithGoogle(profile);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          emailVerified: true,
          nickname: profile.nickname,
          avatar: profile.avatar,
          identities: {
            create: {
              provider: IdentityProvider.google,
              providerId: profile.providerId,
            },
          },
        },
      });
      expect(result.user.email).toBe('test@example.com');
    });
  });
});
