import crypto from 'crypto';
import { User, IUser } from '../models';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/token';
import { ApiError } from '../utils/apiError';
import {
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from '../schemas/auth.schema';
import { emailService } from './email.service';
import { logger } from '../utils/logger';

class AuthService {
  async register(data: RegisterInput): Promise<{ token: string; user: Partial<IUser> }> {
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    const hashedPassword = await hashPassword(data.password);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    try {
      await emailService.sendEmailVerification(user.email, user.name, verificationToken);
    } catch (error) {
      logger.error('Failed to send verification email:', error);
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    return { token, user: userResponse };
  }

  async login(data: LoginInput): Promise<{ token: string; user: Partial<IUser> }> {
    const user = await User.findOne({ email: data.email.toLowerCase() }).select(
      '+password'
    );

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    return { token, user: userResponse };
  }

  async getCurrentUser(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  async updateProfile(
    userId: string,
    data: UpdateProfileInput
  ): Promise<IUser | null> {
    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.preferences) {
      updateData['preferences.theme'] = data.preferences.theme;
      updateData['preferences.editorFont'] = data.preferences.editorFont;
      updateData['preferences.defaultTone'] = data.preferences.defaultTone;

      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) delete updateData[key];
      });
    }

    return User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });
  }

  async changePassword(userId: string, data: ChangePasswordInput): Promise<void> {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isCurrentPasswordValid = await comparePassword(
      data.currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    user.password = await hashPassword(data.newPassword);
    await user.save();
  }

  async forgotPassword(email: string): Promise<string> {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return 'If the email exists, a reset link has been sent';
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      logger.error('Failed to send reset email, logging token for dev:', resetToken);
    }

    return 'If the email exists, a reset link has been sent';
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    user.password = await hashPassword(newPassword);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    try {
      await emailService.sendPasswordChangedNotification(user.email, user.name);
    } catch (error) {
      logger.error('Failed to send password changed notification:', error);
    }
  }

  async verifyEmail(token: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      throw ApiError.badRequest('Invalid or expired verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
  }

  async resendVerification(email: string): Promise<string> {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || user.isEmailVerified) {
      return 'If the email exists and is not verified, a verification link has been sent';
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    try {
      await emailService.sendEmailVerification(user.email, user.name, verificationToken);
    } catch (error) {
      logger.error('Failed to resend verification email:', error);
    }

    return 'If the email exists and is not verified, a verification link has been sent';
  }
}

export const authService = new AuthService();
