import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalAuthGuard } from './guards/optional-auth.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PassportModule.register({ session: false }), EmailModule],
  controllers: [AuthController],
  providers: [AuthService, JwtService, JwtAuthGuard, OptionalAuthGuard, GoogleStrategy],
  exports: [AuthService, JwtService, JwtAuthGuard, OptionalAuthGuard],
})
export class AuthModule {}
