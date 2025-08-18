import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User, BlacklistedToken, PasswordResetToken } from "../models";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
} from "../utils/auth";
import { AuthenticatedRequest } from "../middleware";
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  UpdateProfileInput,
  ResetPasswordRequestInput,
  ResetPasswordInput,
} from "../validations";
import emailService from "../utils/emailService";
import crypto from "crypto";

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      console.log(`🚀 [AuthController] Register endpoint hit`);
      console.log(
        `📝 [AuthController] Request body:`,
        JSON.stringify(req.body, null, 2)
      );

      // Data is already validated by Zod middleware
      const { email, password, role } = req.body as RegisterInput;
      console.log(`✅ [AuthController] Extracted data:`, { email, role });

      // Check if user already exists
      console.log(
        `🔍 [AuthController] Checking if user exists with email: ${email}`
      );
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        console.log(
          `❌ [AuthController] User already exists:`,
          existingUser.email
        );
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      console.log(
        `✅ [AuthController] No existing user found, proceeding with registration`
      );

      // Create new user - use email as username since frontend only sends email/password
      const user = new User({
        username: email.split("@")[0], // Use email prefix as username
        email,
        password,
        role: role || "user",
      });
      console.log(`👤 [AuthController] Creating new user:`, {
        username: email.split("@")[0],
        email,
        role: role || "user",
      });

      await user.save();
      console.log(
        `✅ [AuthController] User saved successfully with ID:`,
        user._id
      );

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      console.log(`🔑 [AuthController] Tokens generated successfully`);

      // Save refresh token to user using atomic operation
      await User.findByIdAndUpdate(user._id, {
        $push: { refreshTokens: refreshToken },
      });

      // Set refresh token as httpOnly cookie (giống như login)
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Use 'lax' in development
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      console.log(`🎉 [AuthController] Registration completed successfully`);
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          accessToken, // Chỉ trả access token, refresh token lưu trong cookie
        },
      });
    } catch (error) {
      console.error(`❌ [AuthController] Registration error:`, error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      // Data is already validated by Zod middleware
      const { email, password } = req.body as LoginInput;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Save refresh token to user using atomic operation
      await User.findByIdAndUpdate(user._id, {
        $push: { refreshTokens: refreshToken },
      });

      // Set refresh token as httpOnly cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Use 'lax' in development
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      res.json({
        success: true,
        message: "Login successful",
        data: {
          accessToken, // Chỉ trả access token
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      console.log(`🔄 [AuthController] Refresh token endpoint hit`);
      console.log(
        `🍪 [AuthController] Cookies received:`,
        Object.keys(req.cookies)
      );

      // Lấy refresh token từ cookie thay vì body
      const refreshToken = req.cookies.refreshToken;
      console.log(`🔑 [AuthController] Refresh token exists:`, !!refreshToken);

      if (!refreshToken) {
        console.log(`❌ [AuthController] No refresh token found in cookies`);
        return res.status(401).json({
          success: false,
          message: "Refresh token is required",
        });
      }

      try {
        console.log(`🔍 [AuthController] Verifying refresh token...`);
        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);
        console.log(
          `✅ [AuthController] Token decoded successfully for user:`,
          decoded.userId
        );

        // Find user and check if refresh token exists
        const user = await User.findById(decoded.userId);
        console.log(`👤 [AuthController] User found:`, !!user);

        if (!user) {
          console.log(
            `❌ [AuthController] User not found for ID:`,
            decoded.userId
          );
          return res.status(403).json({
            success: false,
            message: "Invalid refresh token",
          });
        }

        console.log(
          `🔄 [AuthController] User has ${user.refreshTokens.length} refresh tokens`
        );
        const tokenExists = user.refreshTokens.includes(refreshToken);
        console.log(
          `🔍 [AuthController] Current token exists in user tokens:`,
          tokenExists
        );

        if (!tokenExists) {
          console.log(
            `❌ [AuthController] Refresh token not found in user's token list`
          );
          return res.status(403).json({
            success: false,
            message: "Invalid refresh token",
          });
        }

        // Generate new tokens
        console.log(`🆕 [AuthController] Generating new tokens...`);
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        // Replace old refresh token with new one using atomic operation
        console.log(`🔄 [AuthController] Removing old refresh token...`);
        const updatedUser = await User.findByIdAndUpdate(
          decoded.userId,
          {
            $pull: { refreshTokens: refreshToken },
          },
          { new: true }
        );

        if (!updatedUser) {
          console.log(
            `❌ [AuthController] Failed to update user when removing old token`
          );
          return res.status(403).json({
            success: false,
            message: "Invalid refresh token",
          });
        }

        // Add new refresh token
        console.log(`➕ [AuthController] Adding new refresh token...`);
        await User.findByIdAndUpdate(decoded.userId, {
          $push: { refreshTokens: newRefreshToken },
        });

        // Set cookie mới với refresh token mới
        console.log(`🍪 [AuthController] Setting new refresh token cookie...`);
        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Use 'lax' in development
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: "/",
        });

        console.log(
          `✅ [AuthController] Refresh token successful for user:`,
          user.email
        );
        res.json({
          success: true,
          message: "Tokens refreshed successfully",
          data: {
            accessToken: newAccessToken,
          },
        });
      } catch (error) {
        console.log(`❌ [AuthController] Token verification failed:`, error);
        if (error instanceof Error) {
          if (error.name === "TokenExpiredError") {
            console.log(`⏰ [AuthController] Refresh token expired`);
            return res.status(403).json({
              success: false,
              message: "Refresh token expired. Please login again.",
              code: "REFRESH_TOKEN_EXPIRED",
            });
          } else if (error.name === "JsonWebTokenError") {
            console.log(`🔑 [AuthController] Invalid refresh token format`);
            return res.status(403).json({
              success: false,
              message: "Invalid refresh token",
              code: "INVALID_REFRESH_TOKEN",
            });
          }
        }
        throw error;
      }
    } catch (error) {
      console.error("❌ [AuthController] Token refresh error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      // Lấy access token để blacklist
      const authHeader = req.header("Authorization");
      const accessToken = authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;

      // Lấy refresh token từ cookie
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "No refresh token found",
        });
      }

      try {
        // Verify refresh token để lấy userId
        const decoded = verifyRefreshToken(refreshToken);
        const userId = decoded.userId;

        // Blacklist access token nếu có
        if (accessToken) {
          try {
            const accessDecoded = verifyAccessToken(accessToken);
            if (accessDecoded.exp) {
              await BlacklistedToken.create({
                token: accessToken,
                expiresAt: new Date(accessDecoded.exp * 1000), // Convert từ Unix timestamp
              });
            }
          } catch (error) {
            // Không cần fail logout nếu access token invalid
            console.log(
              "Access token invalid during logout, skipping blacklist"
            );
          }
        }

        // Find user and remove refresh token using atomic operation
        await User.findByIdAndUpdate(userId, {
          $pull: { refreshTokens: refreshToken },
        });

        // Clear cookie
        res.clearCookie("refreshToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          path: "/",
        });

        res.json({
          success: true,
          message: "Logged out successfully",
        });
      } catch (error) {
        // Nếu refresh token không hợp lệ, vẫn clear cookie
        res.clearCookie("refreshToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          path: "/",
        });

        res.json({
          success: true,
          message: "Logged out successfully",
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async logoutAll(req: Request, res: Response) {
    // Đổi từ AuthenticatedRequest thành Request
    try {
      // Lấy access token để blacklist
      const authHeader = req.header("Authorization");
      const accessToken = authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;

      // Lấy refresh token từ cookie
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "No refresh token found",
        });
      }

      try {
        // Verify refresh token để lấy userId
        const decoded = verifyRefreshToken(refreshToken);
        const userId = decoded.userId;

        // Blacklist current access token nếu có
        if (accessToken) {
          try {
            const accessDecoded = verifyAccessToken(accessToken);
            if (accessDecoded.exp) {
              await BlacklistedToken.create({
                token: accessToken,
                expiresAt: new Date(accessDecoded.exp * 1000),
              });
            }
          } catch (error) {
            console.log(
              "Access token invalid during logoutAll, skipping blacklist"
            );
          }
        }

        // Find user and remove ALL refresh tokens using atomic operation
        await User.findByIdAndUpdate(userId, {
          $set: { refreshTokens: [] },
        });

        // Clear cookie hiện tại
        res.clearCookie("refreshToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          path: "/",
        });

        res.json({
          success: true,
          message: "Logged out from all devices successfully",
        });
      } catch (error) {
        // Nếu refresh token không hợp lệ, vẫn clear cookie
        res.clearCookie("refreshToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          path: "/",
        });

        res.json({
          success: true,
          message: "Logged out from all devices successfully",
        });
      }
    } catch (error) {
      console.error("Logout all error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const user = await User.findById(userId).select(
        "-password -refreshTokens"
      );
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            phoneNumber: user.phoneNumber,
            avatar: user.avatar,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      // Data is already validated by Zod middleware
      const { currentPassword, newPassword } = req.body as ChangePasswordInput;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu hiện tại không đúng",
        });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password and clear all refresh tokens using atomic operation
      await User.findByIdAndUpdate(user._id, {
        $set: {
          password: hashedPassword,
          refreshTokens: [],
        },
      });

      res.json({
        success: true,
        message:
          "Password changed successfully. Please login again on all devices.",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    console.log("🚀 [AuthController] UPDATE PROFILE endpoint hit");
    console.log("📝 [AuthController] Request method:", req.method);
    console.log("📝 [AuthController] Request URL:", req.url);
    console.log(
      "📦 [AuthController] Request body:",
      JSON.stringify(req.body, null, 2)
    );
    try {
      const userId = req.user?.userId;
      const { username, phoneNumber, avatar } = req.body as UpdateProfileInput;

      console.log("✅ [AuthController] Extracted data:", {
        username,
        phoneNumber,
        avatar,
      });
      console.log("👤 [AuthController] Authenticated user ID:", userId);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Validate input - allow avatar-only updates
      if (!username && !phoneNumber && !avatar) {
        return res.status(400).json({
          success: false,
          message:
            "At least one field (username, phoneNumber, or avatar) is required to update",
        });
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if username or email already exists (excluding current user)
      const updateFields: any = {};

      if (username && username !== user.username) {
        if (username.length < 3 || username.length > 30) {
          return res.status(400).json({
            success: false,
            message: "Username must be between 3 and 30 characters",
          });
        }

        const existingUsername = await User.findOne({
          username,
          _id: { $ne: userId },
        });

        if (existingUsername) {
          return res.status(400).json({
            success: false,
            message: "Username already exists",
          });
        }

        updateFields.username = username.trim();
      }

      if (phoneNumber && phoneNumber !== user.phoneNumber) {
        // Chuyển đổi phoneNumber thành string trước khi xử lý
        const phoneStr = String(phoneNumber).trim();

        // Kiểm tra nếu chuỗi rỗng sau khi trim
        if (!phoneStr) {
          return res.status(400).json({
            success: false,
            message: "Phone number cannot be empty",
          });
        }

        // Optionally: validate phone format (simple example)
        const phoneRegex = /^[0-9\-\+\s]{8,20}$/;
        if (!phoneRegex.test(phoneStr)) {
          return res.status(400).json({
            success: false,
            message: "Invalid phone number format",
          });
        }

        // Check if phone already exists (excluding current user)
        const existingPhone = await User.findOne({
          phoneNumber: phoneStr,
          _id: { $ne: userId },
        });

        if (existingPhone) {
          return res.status(400).json({
            success: false,
            message: "Phone number already exists",
          });
        }

        updateFields.phoneNumber = phoneStr;
      }

      // Handle avatar update
      if (avatar && avatar !== user.avatar) {
        // Basic URL validation for avatar
        try {
          new URL(avatar);
          updateFields.avatar = avatar.trim();
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: "Invalid avatar URL format",
          });
        }
      }

      // Update user
      console.log(
        "📝 [AuthController] Update fields to apply:",
        JSON.stringify(updateFields, null, 2)
      );
      const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
        new: true,
        runValidators: true,
      }).select("-password -refreshTokens");
      console.log(
        "✅ [AuthController] Updated user:",
        JSON.stringify(
          {
            id: updatedUser?._id,
            username: updatedUser?.username,
            email: updatedUser?.email,
            phoneNumber: updatedUser?.phoneNumber,
            avatar: updatedUser?.avatar,
          },
          null,
          2
        )
      );
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "Failed to update user",
        });
      }

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: {
            id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            phoneNumber: updatedUser.phoneNumber,
            avatar: updatedUser.avatar,
            role: updatedUser.role,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
          },
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async deleteAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { password } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required to delete account",
        });
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Incorrect password",
        });
      }

      // Delete user
      await User.findByIdAndDelete(userId);

      res.json({
        success: true,
        message: "Account deleted successfully",
      });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get public user info
  async getUserPublicInfo(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      // Find user with public info only
      const user = await User.findById(userId).select(
        "username email phoneNumber createdAt avatar"
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber,
          createdAt: user.createdAt,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error("Get user public info error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // POST /api/auth/forgot-password - Request password reset
  async forgotPassword(req: Request, res: Response) {
    try {
      console.log(`🔑 [AuthController] Forgot password request started`);

      // Data is already validated by Zod middleware
      const { email } = req.body as ResetPasswordRequestInput;
      console.log(
        `📧 [AuthController] Processing forgot password for: ${email}`
      );

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`❌ [AuthController] User not found for email: ${email}`);
        // Don't reveal if email exists or not for security
        return res.json({
          success: true,
          message:
            "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu",
        });
      }

      console.log(`✅ [AuthController] User found: ${user._id}`);

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      console.log(
        `🔐 [AuthController] Reset token generated: ${resetToken.substring(
          0,
          10
        )}...`
      );

      // Delete any existing reset tokens for this user
      await PasswordResetToken.deleteMany({ userId: user._id });
      console.log(
        `🗑️ [AuthController] Existing reset tokens deleted for user: ${user._id}`
      );

      // Create new reset token
      const passwordResetToken = new PasswordResetToken({
        userId: user._id,
        token: resetToken,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      });

      await passwordResetToken.save();
      console.log(`💾 [AuthController] Reset token saved to database`);

      // Send reset email
      console.log(`📤 [AuthController] Calling email service...`);
      const emailSent = await emailService.sendPasswordResetEmail(
        email,
        resetToken
      );
      console.log(`📬 [AuthController] Email service returned: ${emailSent}`);

      if (!emailSent) {
        return res.status(500).json({
          success: false,
          message: "Không thể gửi email. Vui lòng thử lại sau",
        });
      }

      console.log(
        `✅ [AuthController] Forgot password process completed successfully`
      );
      res.json({
        success: true,
        message:
          "Email hướng dẫn đặt lại mật khẩu đã được gửi đến địa chỉ email của bạn",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server, vui lòng thử lại sau",
      });
    }
  }

  // POST /api/auth/reset-password - Reset password with token
  async resetPassword(req: Request, res: Response) {
    try {
      // Data is already validated by Zod middleware
      const { token, newPassword } = req.body as ResetPasswordInput;

      // Find valid reset token
      const passwordResetToken = await PasswordResetToken.findOne({
        token,
        used: false,
        expiresAt: { $gt: new Date() },
      });

      if (!passwordResetToken) {
        return res.status(400).json({
          success: false,
          message: "Token không hợp lệ hoặc đã hết hạn",
        });
      }

      // Find user
      const user = await User.findById(passwordResetToken.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update user password and clear all refresh tokens
      await User.findByIdAndUpdate(user._id, {
        $set: {
          password: hashedPassword,
          refreshTokens: [], // Force logout from all devices
        },
      });

      // Mark token as used
      await PasswordResetToken.findByIdAndUpdate(passwordResetToken._id, {
        $set: { used: true },
      });

      res.json({
        success: true,
        message: "Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập lại",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server, vui lòng thử lại sau",
      });
    }
  }
}
