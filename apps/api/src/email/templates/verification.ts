export type VerificationEmailParams = {
  email: string;
  token: string;
  appUrl: string;
};

export function buildVerificationEmail(params: VerificationEmailParams) {
  const url = `${params.appUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(params.token)}`;
  const subject = 'Verify your email address';
  const text = `Verify your email for AI Music Maker: ${url}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <h2 style="margin: 0 0 12px;">Verify your email</h2>
      <p style="margin: 0 0 12px;">Thanks for signing up for AI Music Maker. Click the button below to verify your email address.</p>
      <p style="margin: 24px 0;">
        <a href="${url}" style="background: #111827; color: #fff; text-decoration: none; padding: 12px 18px; border-radius: 6px; display: inline-block;">
          Verify Email
        </a>
      </p>
      <p style="margin: 0 0 8px;">If the button does not work, copy and paste this link:</p>
      <p style="margin: 0; word-break: break-all;">${url}</p>
    </div>
  `;

  return { subject, text, html };
}
