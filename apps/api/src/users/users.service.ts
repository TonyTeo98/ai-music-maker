import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, UserProfileDto } from './dto/update-user.dto';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toUserProfile(user);
  }

  async updateProfile(userId: string, dto: UpdateUserDto): Promise<UserProfileDto> {
    const data: { nickname?: string | null; bio?: string | null } = {};

    if (dto.nickname !== undefined) {
      data.nickname = dto.nickname;
    }

    if (dto.bio !== undefined) {
      data.bio = dto.bio;
    }

    if (Object.keys(data).length === 0) {
      return this.getProfile(userId);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.toUserProfile(user);
  }

  private toUserProfile(user: User): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname ?? undefined,
      avatar: user.avatar ?? undefined,
      bio: user.bio ?? undefined,
      emailVerified: user.emailVerified,
    };
  }
}
