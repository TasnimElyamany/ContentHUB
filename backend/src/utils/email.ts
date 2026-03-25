import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export async function sendCollaboratorInvite(options: {
  to: string;
  inviterName: string;
  documentTitle: string;
  role: 'editor' | 'viewer';
  documentUrl: string;
  isNewUser: boolean;
}): Promise<void> {
  const actionText = options.isNewUser
    ? 'Create a free account to get started.'
    : `You can access it as a <strong>${options.role}</strong>.`;

  await transporter.sendMail({
    from: config.email.from,
    to: options.to,
    subject: `${options.inviterName} invited you to collaborate on "${options.documentTitle}"`,
    html: `
      <div style="font-family: 'Georgia', serif; max-width: 520px; margin: 0 auto; color: #3d3228;">
        <div style="background: #f7f3ef; border-radius: 12px; padding: 2rem;">
          <h2 style="margin: 0 0 0.5rem; font-size: 1.25rem; color: #3d3228;">
            You've been invited to collaborate
          </h2>
          <p style="margin: 0 0 1.5rem; color: #7a6b5a; font-size: 0.95rem;">
            <strong>${options.inviterName}</strong> has invited you to work on
            <strong>"${options.documentTitle}"</strong>. ${actionText}
          </p>
          <a href="${options.documentUrl}"
             style="display: inline-block; background: #6b5b9e; color: #fff;
                    text-decoration: none; padding: 0.65rem 1.5rem;
                    border-radius: 8px; font-size: 0.9rem; font-weight: 600;">
            Open Document
          </a>
        </div>
        <p style="margin-top: 1rem; font-size: 0.75rem; color: #b0a090; text-align: center;">
          ContentHub — Your all-in-one content workspace
        </p>
      </div>
    `,
  });
}
