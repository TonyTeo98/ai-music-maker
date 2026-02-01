import { SignJWT, importPKCS8 } from 'jose';
import { generateKeyPairSync } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from './jwt.service';
import { PrismaService } from '../prisma/prisma.service';

type MockedPrismaService = PrismaService & {
  refreshToken: {
    create: jest.Mock;
  };
};

describe('JwtService', () => {
  let service: JwtService;
  let prisma: MockedPrismaService;
  let configService: ConfigService;
  let privateKey: string;
  let publicKey: string;

  beforeAll(() => {
    const keyPair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    privateKey = keyPair.privateKey;
    publicKey = keyPair.publicKey;
  });

  beforeEach(() => {
    prisma = {
      refreshToken: {
        create: jest.fn(),
      },
    } as unknown as MockedPrismaService;

    configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'JWT_PRIVATE_KEY') return privateKey;
        if (key === 'JWT_PUBLIC_KEY') return publicKey;
        if (key === 'JWT_ACCESS_EXPIRES') return '15m';
        if (key === 'JWT_REFRESH_EXPIRES') return '7d';
        return defaultValue;
      }),
    } as unknown as ConfigService;

    service = new JwtService(configService, prisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('generateAccessToken returns valid JWT with expected claims', async () => {
    const token = await service.generateAccessToken({
      sub: 'user-1',
      email: 'test@example.com',
      tokenVersion: 2,
    });

    const payload = await service.verifyAccessToken(token);

    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('test@example.com');
    expect(payload.tokenVersion).toBe(2);
  });

  it('verifyAccessToken returns payload for valid token', async () => {
    const token = await service.generateAccessToken({
      sub: 'user-1',
      email: 'test@example.com',
      tokenVersion: 0,
    });

    const payload = await service.verifyAccessToken(token);

    expect(payload.sub).toBe('user-1');
  });

  it('verifyAccessToken throws for expired token', async () => {
    const key = await importPKCS8(privateKey, 'RS256');
    const expiredToken = await new SignJWT({ email: 'test@example.com', tokenVersion: 0 })
      .setProtectedHeader({ alg: 'RS256' })
      .setSubject('user-1')
      .setIssuedAt()
      .setExpirationTime(new Date(Date.now() - 1_000))
      .sign(key);

    await expect(service.verifyAccessToken(expiredToken)).rejects.toThrow();
  });

  it('verifyAccessToken throws for invalid signature', async () => {
    const otherKeyPair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const badKey = await importPKCS8(otherKeyPair.privateKey, 'RS256');

    const token = await new SignJWT({ email: 'test@example.com', tokenVersion: 0 })
      .setProtectedHeader({ alg: 'RS256' })
      .setSubject('user-1')
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(badKey);

    await expect(service.verifyAccessToken(token)).rejects.toThrow();
  });

  it('generateRefreshToken stores hashed token in DB', async () => {
    prisma.refreshToken.create.mockResolvedValue({ id: 'refresh-1' } as any);

    const token = await service.generateRefreshToken('user-1', 'device');
    const tokenHash = service.hashToken(token);

    expect(prisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          deviceInfo: 'device',
          tokenHash,
          expiresAt: expect.any(Date),
        }),
      }),
    );
  });
});
