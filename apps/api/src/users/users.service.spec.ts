import { NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

type MockedPrismaService = PrismaService & {
  user: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: MockedPrismaService;

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

  const buildUser = (overrides: Partial<User> = {}): User => ({
    ...baseUser,
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    } as unknown as MockedPrismaService;

    service = new UsersService(prisma);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('getProfile returns mapped user data', async () => {
    const user = buildUser({ nickname: 'Tester', bio: 'Hello' });
    prisma.user.findUnique.mockResolvedValue(user);

    const result = await service.getProfile('user-1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    expect(result).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      nickname: 'Tester',
      avatar: undefined,
      bio: 'Hello',
      emailVerified: false,
    });
  });

  it('getProfile throws when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getProfile('missing')).rejects.toThrow(NotFoundException);
  });

  it('updateProfile updates provided fields', async () => {
    const user = buildUser({ nickname: 'New Nick', bio: 'New Bio' });
    prisma.user.update.mockResolvedValue(user);

    const result = await service.updateProfile('user-1', {
      nickname: 'New Nick',
      bio: 'New Bio',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { nickname: 'New Nick', bio: 'New Bio' },
    });
    expect(result).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      nickname: 'New Nick',
      avatar: undefined,
      bio: 'New Bio',
      emailVerified: false,
    });
  });

  it('updateProfile returns current profile when no fields are provided', async () => {
    const user = buildUser();
    prisma.user.findUnique.mockResolvedValue(user);

    const result = await service.updateProfile('user-1', {});

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    expect(result).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      nickname: undefined,
      avatar: undefined,
      bio: undefined,
      emailVerified: false,
    });
  });
});
