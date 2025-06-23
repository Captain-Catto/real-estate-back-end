import { Response } from "express";
import { Favorite, Post } from "../models";
import { AuthenticatedRequest } from "../middleware";
import mongoose from "mongoose";

export class FavoriteController {
  // Add post to favorites
  async addToFavorites(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { postId } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      if (!postId) {
        return res.status(400).json({
          success: false,
          message: "Post ID is required",
        });
      }

      // Validate postId format
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid post ID format",
        });
      }

      // Check if post exists
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Check if already favorited
      const existingFavorite = await Favorite.findOne({
        user: userId,
        post: postId,
      });

      if (existingFavorite) {
        return res.status(400).json({
          success: false,
          message: "Post is already in favorites",
        });
      }

      // Create favorite
      const favorite = new Favorite({
        user: userId,
        post: postId,
      });

      await favorite.save();

      res.status(201).json({
        success: true,
        message: "Post added to favorites successfully",
        data: {
          favoriteId: favorite._id,
          postId: postId,
          createdAt: favorite.createdAt,
        },
      });
    } catch (error) {
      console.error("Add to favorites error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Remove post from favorites
  async removeFromFavorites(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { postId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid post ID format",
        });
      }

      // Find and remove favorite
      const favorite = await Favorite.findOneAndDelete({
        user: userId,
        post: postId,
      });

      if (!favorite) {
        return res.status(404).json({
          success: false,
          message: "Favorite not found",
        });
      }

      res.json({
        success: true,
        message: "Post removed from favorites successfully",
      });
    } catch (error) {
      console.error("Remove from favorites error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get user's favorite posts
  async getFavorites(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Get favorites with populated post data
      const favorites = await Favorite.find({ user: userId })
        .populate({
          path: "post",
          populate: {
            path: "author",
            select: "username email avatar",
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Filter out favorites where post might be deleted
      const validFavorites = favorites.filter((favorite) => favorite.post);

      // Get total count for pagination
      const totalFavorites = await Favorite.countDocuments({ user: userId });

      res.json({
        success: true,
        data: {
          favorites: validFavorites.map((favorite) => ({
            favoriteId: favorite._id,
            post: favorite.post,
            createdAt: favorite.createdAt,
          })),
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalFavorites / limit),
            totalItems: totalFavorites,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Check if post is favorited by user
  async checkFavoriteStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { postId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid post ID format",
        });
      }

      const favorite = await Favorite.findOne({
        user: userId,
        post: postId,
      });

      res.json({
        success: true,
        data: {
          isFavorited: !!favorite,
          favoriteId: favorite?._id || null,
        },
      });
    } catch (error) {
      console.error("Check favorite status error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get favorite statistics
  async getFavoriteStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const totalFavorites = await Favorite.countDocuments({ user: userId });

      // Get favorites by category
      const favoritesByCategory = await Favorite.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        {
          $lookup: {
            from: "posts",
            localField: "post",
            foreignField: "_id",
            as: "postData",
          },
        },
        { $unwind: "$postData" },
        {
          $group: {
            _id: "$postData.category",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      res.json({
        success: true,
        data: {
          totalFavorites,
          favoritesByCategory,
        },
      });
    } catch (error) {
      console.error("Get favorite stats error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
