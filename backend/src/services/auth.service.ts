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

class AuthService {
  async register(data: RegisterInput): Promise<{ token: string; user: Partial<IUser> }> {
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
    });

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

    // In production, send email with reset link
    // For now, return the token (remove in production)
    return resetToken;
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
  }
}

export const authService = new AuthService();
