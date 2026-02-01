import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { buildVerificationEmail } from './templates/verification';
import { buildPasswordResetEmail } from './templates/password-reset';

@Injectable()
export class EmailService {
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = this.configService.get<string>('EMAIL_FROM', 'noreply@example.com');
    this.appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    this.assertConfigured();
    const { subject, html, text } = buildVerificationEmail({
      email,
      token,
      appUrl: this.appUrl,
    });

    await this.resend!.emails.send({
      from: this.from,
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    this.assertConfigured();
    const { subject, html, text } = buildPasswordResetEmail({
      email,
      token,
      appUrl: this.appUrl,
    });

    await this.resend!.emails.send({
      from: this.from,
      to: email,
      subject,
      html,
      text,
    });
  }

  private assertConfigured() {
    if (!this.resend) {
      throw new InternalServerErrorException('Email service is not configured');
    }
  }
}
