import { Request, Response } from "express";
import { User } from "../models";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/auth";
import { AuthenticatedRequest } from "../middleware";

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;

      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Username, email, and password are required",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      // kiểm tra password phải có 1 ký tự chữ hoa, 1 ký tự số
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          success: false,
          message:
            "Password must contain at least one uppercase letter and one number",
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email or username already exists",
        });
      }

      // Create new user
      const user = new User({ username, email, password });
      await user.save();

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Save refresh token to user
      user.refreshTokens.push(refreshToken);
      await user.save();

      // Set refresh token as httpOnly cookie (giống như login)
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          accessToken, // Chỉ trả access token, refresh token lưu trong cookie
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

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

      // Save refresh token to user
      user.refreshTokens.push(refreshToken);
      await user.save();

      // Set refresh token as httpOnly cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "strict",
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
      // Lấy refresh token từ cookie thay vì body
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Refresh token is required",
        });
      }

      try {
        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Find user and check if refresh token exists
        const user = await User.findById(decoded.userId);
        if (!user || !user.refreshTokens.includes(refreshToken)) {
          return res.status(403).json({
            success: false,
            message: "Invalid refresh token",
          });
        }

        // Generate new tokens
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        // Replace old refresh token with new one
        user.refreshTokens = user.refreshTokens.filter(
          (token) => token !== refreshToken
        );
        user.refreshTokens.push(newRefreshToken);
        await user.save();

        // Set cookie mới với refresh token mới
        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: "/",
        });

        res.json({
          success: true,
          message: "Tokens refreshed successfully",
          data: {
            accessToken: newAccessToken,
          },
        });
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === "TokenExpiredError") {
            return res.status(403).json({
              success: false,
              message: "Refresh token expired. Please login again.",
              code: "REFRESH_TOKEN_EXPIRED",
            });
          } else if (error.name === "JsonWebTokenError") {
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
      console.error("Token refresh error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async logout(req: Request, res: Response) {
    try {
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

        // Find user and remove refresh token
        const user = await User.findById(userId);
        if (user) {
          user.refreshTokens = user.refreshTokens.filter(
            (token) => token !== refreshToken
          );
          await user.save();
        }

        // Clear cookie
        res.clearCookie("refreshToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
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
          sameSite: "strict",
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

        // Find user and remove ALL refresh tokens
        const user = await User.findById(userId);
        if (user) {
          user.refreshTokens = []; // Clear tất cả refresh tokens
          await user.save();
        }

        // Clear cookie hiện tại
        res.clearCookie("refreshToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
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
          sameSite: "strict",
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
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password and new password are required",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long",
        });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({
          success: false,
          message: "New password must be different from current password",
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
          message: "Current password is incorrect",
        });
      }

      // Update password
      user.password = newPassword;

      // Clear all refresh tokens to force re-login on all devices
      user.refreshTokens = [];

      await user.save();

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
    console.log("=== UPDATE PROFILE ENDPOINT HIT ===");
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);
    console.log("Request headers:", req.headers);
    try {
      const userId = req.user?.userId;
      const { username, email, phoneNumber } = req.body;

      console.log("Update profile request:", req.body);
      console.log("Authenticated user ID:", userId);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Validate input
      if (!username && !email) {
        return res.status(400).json({
          success: false,
          message:
            "At least one field (username or email) is required to update",
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

      if (email && email !== user.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: "Invalid email format",
          });
        }

        const existingEmail = await User.findOne({
          email: email.toLowerCase(),
          _id: { $ne: userId },
        });

        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: "Email already exists",
          });
        }

        updateFields.email = email.toLowerCase().trim();
      }

      if (phoneNumber && phoneNumber !== user.phoneNumber) {
        // Optionally: validate phone format (simple example)
        const phoneRegex = /^[0-9\-\+\s]{8,20}$/;
        if (!phoneRegex.test(phoneNumber)) {
          return res.status(400).json({
            success: false,
            message: "Invalid phone number format",
          });
        }

        // Check if phone already exists (excluding current user)
        const existingPhone = await User.findOne({
          phoneNumber,
          _id: { $ne: userId },
        });

        if (existingPhone) {
          return res.status(400).json({
            success: false,
            message: "Phone number already exists",
          });
        }

        updateFields.phoneNumber = phoneNumber.trim();
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
        new: true,
        runValidators: true,
      }).select("-password -refreshTokens");

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
}
