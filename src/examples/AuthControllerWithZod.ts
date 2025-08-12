// Example: Updated AuthController với Zod validation
import { Request, Response } from "express";
import { User } from "../models";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/auth";
import { AuthenticatedRequest } from "../middleware";

// Import Zod schemas
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  type RegisterInput,
  type LoginInput,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from "../validations";

export class AuthController {
  // Register với Zod validation
  async register(req: Request, res: Response) {
    try {
      // Zod validation được thực hiện trong middleware, data đã được validate
      const validatedData = req.body as RegisterInput;
      const { fullName, email, password, phone, role } = validatedData;

      // Check if user already exists
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email này đã được sử dụng",
        });
      }

      // Create new user
      const newUser = new User({
        fullName,
        email,
        password, // Will be hashed by the model
        phone,
        role,
        isEmailVerified: false,
      });

      await newUser.save();

      // Generate tokens
      const accessToken = generateAccessToken(newUser._id);
      const refreshToken = generateRefreshToken(newUser._id);

      // Update user with refresh token
      newUser.refreshToken = refreshToken;
      await newUser.save();

      // Set HTTP-only cookies
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(201).json({
        success: true,
        message: "Đăng ký thành công",
        data: {
          user: {
            id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            role: newUser.role,
            isEmailVerified: newUser.isEmailVerified,
          },
          accessToken,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  // Login với Zod validation
  async login(req: Request, res: Response) {
    try {
      // Data đã được validate bởi middleware
      const validatedData = req.body as LoginInput;
      const { email, password } = validatedData;

      // Find user
      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không đúng",
        });
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không đúng",
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Tài khoản đã bị vô hiệu hóa",
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Update refresh token
      user.refreshToken = refreshToken;
      user.lastLogin = new Date();
      await user.save();

      // Set cookies
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message: "Đăng nhập thành công",
        data: {
          user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
          },
          accessToken,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  // Change password với Zod validation
  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = req.body as ChangePasswordInput;
      const { currentPassword, newPassword } = validatedData;
      const userId = req.user?.id;

      // Get user with password
      const user = await User.findById(userId).select("+password");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      // Verify current password
      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu hiện tại không đúng",
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Đổi mật khẩu thành công",
      });
    } catch (error) {
      console.error("Change password error:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  // Update profile với Zod validation
  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = req.body as UpdateProfileInput;
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      // Update only provided fields
      Object.keys(validatedData).forEach((key) => {
        if (validatedData[key as keyof UpdateProfileInput] !== undefined) {
          (user as any)[key] = validatedData[key as keyof UpdateProfileInput];
        }
      });

      await user.save();

      return res.status(200).json({
        success: true,
        message: "Cập nhật thông tin thành công",
        data: {
          user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            address: user.address,
          },
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  // ... các methods khác
}
