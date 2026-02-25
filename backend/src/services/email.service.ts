import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../utils/logger';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetUrl = `${config.frontendUrl}/auth/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: config.email.from,
      to,
      subject: 'ContentHub AI - Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3d4d5c; margin: 0;">ContentHub AI</h1>
          </div>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 30px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #555; line-height: 1.6;">
              You requested a password reset. Click the button below to set a new password.
              This link will expire in <strong>1 hour</strong>.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                style="background-color: #5a6b7d; color: white; padding: 12px 30px;
                text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #888; font-size: 14px; line-height: 1.6;">
              If you didn't request this, you can safely ignore this email. Your password will not be changed.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #aaa; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #5a6b7d;">${resetUrl}</a>
            </p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${to}`);
    } catch (error: any) {
      logger.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendEmailVerification(to: string, name: string, verificationToken: string): Promise<void> {
    const verifyUrl = `${config.frontendUrl}/auth/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: config.email.from,
      to,
      subject: 'ContentHub AI - Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3d4d5c; margin: 0;">ContentHub AI</h1>
          </div>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 30px;">
            <h2 style="color: #333; margin-top: 0;">Welcome, ${name}!</h2>
            <p style="color: #555; line-height: 1.6;">
              Thanks for signing up. Please verify your email address by clicking the button below.
              This link will expire in <strong>24 hours</strong>.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}"
                style="background-color: #5a6b7d; color: white; padding: 12px 30px;
                text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p style="color: #888; font-size: 14px; line-height: 1.6;">
              If you didn't create an account, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #aaa; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verifyUrl}" style="color: #5a6b7d;">${verifyUrl}</a>
            </p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to ${to}`);
    } catch (error: any) {
      logger.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordChangedNotification(to: string, name: string): Promise<void> {
    const mailOptions = {
      from: config.email.from,
      to,
      subject: 'ContentHub AI - Password Changed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3d4d5c; margin: 0;">ContentHub AI</h1>
          </div>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 30px;">
            <h2 style="color: #333; margin-top: 0;">Password Changed</h2>
            <p style="color: #555; line-height: 1.6;">
              Hi ${name}, your password was successfully changed.
            </p>
            <p style="color: #555; line-height: 1.6;">
              If you did not make this change, please reset your password immediately or contact support.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${config.frontendUrl}/auth/forgot-password"
                style="background-color: #dc2626; color: white; padding: 12px 30px;
                text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                Reset Password
              </a>
            </div>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Password changed notification sent to ${to}`);
    } catch (error: any) {
      logger.error('Failed to send password changed notification:', error);
    }
  }
}

export const emailService = new EmailService();
