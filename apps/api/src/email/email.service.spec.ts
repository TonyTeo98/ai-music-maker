let mockSend: jest.Mock;

jest.mock('resend', () => {
  mockSend = jest.fn();
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: mockSend,
      },
    })),
  };
});

import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  beforeEach(() => {
    mockSend.mockClear();
    configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'RESEND_API_KEY') return 'test-key';
        if (key === 'EMAIL_FROM') return 'noreply@aimm.test';
        if (key === 'APP_URL') return 'http://localhost:3000';
        return defaultValue;
      }),
    } as unknown as ConfigService;

    service = new EmailService(configService);
  });

  it('sendVerificationEmail sends verification email via Resend', async () => {
    await service.sendVerificationEmail('user@example.com', 'token-123');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'noreply@aimm.test',
        to: 'user@example.com',
        subject: 'Verify your email address',
        html: expect.any(String),
        text: expect.any(String),
      }),
    );
  });

  it('sendPasswordResetEmail sends reset email via Resend', async () => {
    await service.sendPasswordResetEmail('user@example.com', 'token-456');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'noreply@aimm.test',
        to: 'user@example.com',
        subject: 'Reset your password',
        html: expect.any(String),
        text: expect.any(String),
      }),
    );
  });
});
