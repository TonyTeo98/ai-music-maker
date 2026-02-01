export type PasswordResetEmailParams = {
  email: string;
  token: string;
  appUrl: string;
};

export function buildPasswordResetEmail(params: PasswordResetEmailParams) {
  const url = `${params.appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(params.token)}`;
  const subject = 'Reset your password';
  const text = `Reset your AI Music Maker password: ${url}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <h2 style="margin: 0 0 12px;">Reset your password</h2>
      <p style="margin: 0 0 12px;">We received a request to reset your password. Click the button below to continue.</p>
      <p style="margin: 24px 0;">
        <a href="${url}" style="background: #111827; color: #fff; text-decoration: none; padding: 12px 18px; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p style="margin: 0 0 8px;">If the button does not work, copy and paste this link:</p>
      <p style="margin: 0; word-break: break-all;">${url}</p>
    </div>
  `;

  return { subject, text, html };
}
