import { Request, Response } from "express";
import {
  Post,
  Package,
  Category,
  Wallet,
  Payment,
  PriceRange,
} from "../models";
import { AuthenticatedRequest } from "../middleware";
import mongoose from "mongoose";
import { ProvinceModel, WardModel } from "../models/Location";
import { NotificationService } from "../services/NotificationService";

export class PostController {
  // Create new post
  async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const {
        type,
        title,
        description,
        content,
        price,
        location,
        category,
        tags,
        package: postPackage,
        area,
        currency,
        legalDocs,
        furniture,
        bedrooms,
        bathrooms,
        floors,
        houseDirection,
        balconyDirection,
        roadWidth,
        frontWidth,
        packageId,
        packageDuration,
        project,
      } = req.body;

      const images: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file: any) => {
          images.push(file.location);
        });
      }

      let parsedLocation = location;
      if (typeof location === "string") {
        try {
          parsedLocation = JSON.parse(location);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: "Định dạng location không hợp lệ",
          });
        }
      }

      if (!parsedLocation || !parsedLocation.province || !parsedLocation.ward) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin địa chỉ (province, ward)",
        });
      }

      // Tính toán expiredAt dựa trên packageId và packageDuration
      let expiredAt = null;
      let originalPackageDuration = packageDuration;

      if (packageId && packageDuration) {
        // Lấy thông tin package từ database
        const packageInfo = await Package.findOne({
          id: packageId,
          isActive: true,
        });

        if (packageInfo) {
          // Sử dụng duration từ package hiện tại nếu không có packageDuration
          const durationToUse = packageDuration || packageInfo.duration;
          originalPackageDuration = durationToUse;

          // Tính ngày hết hạn từ ngày hiện tại
          const now = new Date();
          expiredAt = new Date(
            now.getTime() + durationToUse * 24 * 60 * 60 * 1000
          );

          console.log(
            `📅 Post expiry calculated: Package ${packageId}, Duration: ${durationToUse} days, Expires at: ${expiredAt}`
          );
        } else {
          console.warn(
            `⚠️ Package ${packageId} not found or inactive, post will not have expiry date`
          );
        }
      }

      // Convert category to ObjectId
      let categoryId;
      if (mongoose.Types.ObjectId.isValid(category)) {
        // If already an ObjectId, use it directly
        categoryId = new mongoose.Types.ObjectId(category);
        console.log(`✅ Category is already ObjectId: ${categoryId}`);
      } else {
        // Try to find category by id field first (like "cat_apartment")
        console.log(`🔍 Looking for category with id: "${category}"`);
        let categoryDoc = await Category.findOne({ id: category });

        if (!categoryDoc) {
          // If not found by id, try finding by name as fallback
          console.log(
            `🔍 Category not found by id, trying by name: "${category}"`
          );
          categoryDoc = await Category.findOne({ name: category });
        }

        console.log(`📝 Category found:`, categoryDoc);
        if (!categoryDoc) {
          console.log(`❌ Category "${category}" not found in database`);
          return res.status(400).json({
            success: false,
            message: `Category "${category}" not found`,
          });
        }
        categoryId = categoryDoc._id;
        console.log(`✅ Category ObjectId found: ${categoryId}`);
      }

      const post = new Post({
        type,
        title,
        description,
        content,
        price: price || null,
        location: parsedLocation || null,
        category: categoryId,
        tags: tags || [],
        author: userId,
        images,
        package: postPackage || "free",
        area,
        currency,
        legalDocs,
        furniture,
        bedrooms,
        bathrooms,
        floors,
        houseDirection,
        balconyDirection,
        roadWidth,
        frontWidth,
        packageId,
        packageDuration: originalPackageDuration,
        expiredAt,
        originalPackageDuration,
        project:
          project && mongoose.Types.ObjectId.isValid(project) ? project : null,
      });

      await post.save();
      await post.populate("author", "username email avatar");
      await post.populate("category", "name slug");

      res.status(201).json({
        success: true,
        message: "Post created successfully",
        data: { post },
      });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
  // Get all posts with pagination and filters
  async getPosts(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const {
        category,
        status,
        search,
        author,
        type,
        package: packageFilter,
        project,
        price,
        priceRange,
        area,
        areaRange,
        province,
        provinceCode,
        ward,
        wardCode,
      } = req.query;

      // Build filter object
      const filter: any = {};

      // Handle category filter - convert to ObjectId if needed
      if (category) {
        if (mongoose.Types.ObjectId.isValid(category as string)) {
          // If already an ObjectId, use it directly
          filter.category = category;
        } else {
          // If category ID (like "cat_apartment"), find the category by id field
          const categoryDoc = await Category.findOne({ id: category });
          if (categoryDoc) {
            filter.category = categoryDoc._id;
          } else {
            // If not found by id, try finding by name as fallback
            const categoryDocByName = await Category.findOne({
              name: category,
            });
            if (categoryDocByName) {
              filter.category = categoryDocByName._id;
            } else {
              console.log(`❌ Category "${category}" not found in database`);
              // Don't return error, just skip this filter to show all posts
            }
          }
        }
      }

      if (status) filter.status = status;
      if (type && type !== "all") filter.type = type;
      if (author && mongoose.Types.ObjectId.isValid(author as string)) {
        filter.author = author;
      }

      // Handle package filter - including "free" package
      if (packageFilter && packageFilter !== "all") {
        filter.package = packageFilter;
      }

      // Handle project filter
      if (project && project !== "all") {
        console.log("🔍 Project filter detected:", {
          project,
          type: typeof project,
          isValidObjectId: mongoose.Types.ObjectId.isValid(project as string),
        });

        if (mongoose.Types.ObjectId.isValid(project as string)) {
          const projectObjectId = new mongoose.Types.ObjectId(
            project as string
          );
          filter.project = projectObjectId;
          console.log("🔍 Added project filter to query:", {
            originalProject: project,
            convertedProject: projectObjectId,
            filterProject: filter.project,
          });
        } else {
          console.log("❌ Invalid project ObjectId:", project);
          return res.status(400).json({
            success: false,
            message: "Invalid project ID format",
          });
        }
      } else {
        console.log("🔍 No project filter or project = 'all':", project);
      }

      // Location filtering - support both codes and slugs
      // Province filter
      if (provinceCode) {
        filter["location.province"] = provinceCode;
        console.log("📍 Filtering by provinceCode:", provinceCode);
      } else if (province) {
        // Handle province slug
        const provinceSlug = province as string;
        console.log("📍 Converting province slug to code:", provinceSlug);

        try {
          const provinceDoc = await ProvinceModel.findOne({
            $or: [
              { slug: provinceSlug },
              { slug: `tinh-${provinceSlug}` },
              { slug: `thanh-pho-${provinceSlug}` },
            ],
          });

          if (provinceDoc) {
            filter["location.province"] = provinceDoc.code;
            console.log(
              `✅ Province slug "${provinceSlug}" -> code "${provinceDoc.code}"`
            );
          } else {
            console.log(`❌ Province slug "${provinceSlug}" not found`);
          }
        } catch (error) {
          console.error("Error converting province slug:", error);
        }
      }

      // Ward filter
      if (wardCode) {
        filter["location.ward"] = wardCode;
        console.log("📍 Filtering by wardCode:", wardCode);
      } else if (ward) {
        // Handle ward slug
        const wardSlug = ward as string;
        console.log("📍 Converting ward slug to code:", wardSlug);

        try {
          const wardDoc = await WardModel.findOne({
            $or: [
              { slug: wardSlug },
              { slug: `xa-${wardSlug}` },
              { slug: `phuong-${wardSlug}` },
              { slug: `thi-tran-${wardSlug}` },
            ],
          });

          if (wardDoc) {
            filter["location.ward"] = wardDoc.code;
            console.log(`✅ Ward slug "${wardSlug}" -> code "${wardDoc.code}"`);
          } else {
            console.log(`❌ Ward slug "${wardSlug}" not found`);
          }
        } catch (error) {
          console.error("Error converting ward slug:", error);
        }
      }

      // Price range filter with overlap logic
      if (price || priceRange) {
        const priceParam = price || priceRange;
        console.log("💰 Filtering by price:", priceParam);

        try {
          const { PriceRange } = await import("../models/Price");
          const priceRangeDoc = await PriceRange.findOne({
            $or: [{ slug: priceParam }, { id: priceParam }],
            type: { $in: ["ban", "cho-thue"] }, // Support both buy and rent
          });

          if (priceRangeDoc) {
            // Parse numeric values from price range name như "1 - 2 tỷ"
            const priceMatch = priceRangeDoc.name.match(/(\d+)\s*[-–]\s*(\d+)/);
            if (priceMatch) {
              const minPrice = parseInt(priceMatch[1]);
              const maxPrice = parseInt(priceMatch[2]);

              // Generate overlapping price patterns
              const priceRegexPatterns = [];
              for (let i = minPrice - 3; i <= maxPrice + 3; i++) {
                for (let j = i + 1; j <= maxPrice + 5; j++) {
                  if (i <= maxPrice && j >= minPrice) {
                    priceRegexPatterns.push(`${i}\\s*[-–]\\s*${j}\\s*tỷ`);
                  }
                }
              }

              if (priceRegexPatterns.length > 0) {
                filter.price = {
                  $regex: priceRegexPatterns.join("|"),
                  $options: "i",
                };
                console.log(
                  `✅ Price filter "${priceParam}" (${minPrice}-${maxPrice}) -> overlapping ranges pattern`
                );
              }
            } else {
              // Fallback: exact string match với flexible spacing
              filter.price = {
                $regex: priceRangeDoc.name.replace(/[-\s]/g, "\\s*[-–]\\s*"),
                $options: "i",
              };
              console.log(
                `✅ Price filter "${priceParam}" -> flexible pattern for: "${priceRangeDoc.name}"`
              );
            }
          } else {
            console.log(`❌ Price range "${priceParam}" not found`);
          }
        } catch (error) {
          console.error("Error converting price filter:", error);
        }
      }

      // Area range filter with overlap logic
      if (area || areaRange) {
        const areaParam = area || areaRange;
        console.log("📏 Filtering by area:", areaParam);

        try {
          const { Area } = await import("../models/Area");
          const areaRangeDoc = await Area.findOne({
            $or: [{ slug: areaParam }, { id: areaParam }],
            type: "property", // For posts, use property type
          });

          if (areaRangeDoc) {
            // Parse numeric values from area range name như "50 - 100 m²"
            const areaMatch = areaRangeDoc.name.match(/(\d+)\s*[-–]\s*(\d+)/);
            if (areaMatch) {
              const minArea = parseInt(areaMatch[1]);
              const maxArea = parseInt(areaMatch[2]);

              // Generate overlapping area patterns
              const areaRegexPatterns = [];
              for (let i = minArea - 20; i <= maxArea + 20; i += 5) {
                for (let j = i + 10; j <= maxArea + 50; j += 5) {
                  if (i <= maxArea && j >= minArea) {
                    areaRegexPatterns.push(`${i}\\s*[-–]\\s*${j}\\s*m²`);
                  }
                }
              }

              if (areaRegexPatterns.length > 0) {
                filter.area = {
                  $regex: areaRegexPatterns.join("|"),
                  $options: "i",
                };
                console.log(
                  `✅ Area filter "${areaParam}" (${minArea}-${maxArea}) -> overlapping ranges pattern`
                );
              }
            } else {
              // Fallback: exact string match với flexible spacing
              filter.area = {
                $regex: areaRangeDoc.name.replace(/[-\s]/g, "\\s*[-–]\\s*"),
                $options: "i",
              };
              console.log(
                `✅ Area filter "${areaParam}" -> flexible pattern for: "${areaRangeDoc.name}"`
              );
            }
          } else {
            console.log(`❌ Area range "${areaParam}" not found`);
          }
        } catch (error) {
          console.error("Error converting area filter:", error);
        }
      }

      // Add text search if provided
      if (search) {
        filter.$text = { $search: search as string };
      }

      // QUAN TRỌNG: Loại bỏ posts đã hết hạn từ kết quả
      // Nếu status là 'active', chỉ lấy posts chưa hết hạn
      if (status === "active" || !status) {
        const now = new Date();
        filter.$and = [
          ...(filter.$and || []),
          {
            $or: [
              { expiredAt: { $exists: false } }, // Posts không có expiry date
              { expiredAt: null }, // Posts với expiry date = null
              { expiredAt: { $gt: now } }, // Posts chưa hết hạn
            ],
          },
        ];
      }

      console.log("🔍 Final filter object:", JSON.stringify(filter, null, 2));

      const posts = await Post.find(filter)
        .populate("author", "username email avatar")
        .populate("category", "name slug")
        .populate("project", "name address")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPosts = await Post.countDocuments(filter);

      res.json({
        success: true,
        data: {
          posts,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalItems: totalPosts,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get single post by ID
  async getPostById(req: AuthenticatedRequest, res: Response) {
    try {
      const { postId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid post ID format",
        });
      }

      const post = await Post.findById(postId)
        .populate("author", "username email avatar phoneNumber")
        .populate("category", "name slug");

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Nếu location là code, tìm name trong LocationModel
      let locationWithName = post.location;

      try {
        // Chỉ convert nếu giá trị là số hợp lệ
        const provinceCode = post.location.province;
        const wardCode = post.location.ward;

        if (provinceCode && !isNaN(Number(provinceCode))) {
          const province = await ProvinceModel.findOne({
            code: Number(provinceCode),
          });

          if (province) {
            let wardName = wardCode;

            // Buscar ward diretamente
            if (wardCode && !isNaN(Number(wardCode))) {
              const ward = await WardModel.findOne({
                code: Number(wardCode),
                parent_code: provinceCode,
              });

              if (ward) {
                wardName = ward.name || wardCode;
              }
            }

            locationWithName = {
              province: province.name || provinceCode,
              ward: wardName || wardCode,
              street: post.location.street || "",
            };
          }
        }
      } catch (locationError) {
        console.error(
          "Error converting location codes to names:",
          locationError
        );
        // Fallback to original location if conversion fails
        locationWithName = post.location;
      }

      res.json({
        success: true,
        data: {
          post: {
            ...post.toObject(),
            location: locationWithName,
          },
        },
      });
    } catch (error) {
      console.error("Get post by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Lấy danh sách bài đăng của người dùng hiện tại với các tham số lọc
  async getMyPosts(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Phân trang
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Lấy các tham số lọc
      const { status, type, search, dateRange, startDate, endDate } = req.query;

      // Xây dựng bộ lọc
      const filter: any = { author: userId };

      // Lọc theo trạng thái
      if (status && status !== "all") {
        filter.status = status;

        // Nếu status là 'active', thêm kiểm tra expiry
        if (status === "active") {
          const now = new Date();
          filter.$and = [
            ...(filter.$and || []),
            {
              $or: [
                { expiredAt: { $exists: false } }, // Posts không có expiry date
                { expiredAt: null }, // Posts với expiry date = null
                { expiredAt: { $gt: now } }, // Posts chưa hết hạn
              ],
            },
          ];
        }
      }

      // Lọc theo loại tin (bán/cho thuê)
      if (type && type !== "all") {
        filter.type = type;
      }

      // Lọc theo từ khóa tìm kiếm (title hoặc ID)
      if (search) {
        if (mongoose.Types.ObjectId.isValid(search as string)) {
          // Nếu search là ID hợp lệ, thêm điều kiện tìm theo ID
          filter.$or = [
            { title: { $regex: search, $options: "i" } }, // Case insensitive search
            { _id: new mongoose.Types.ObjectId(search as string) },
          ];
        } else {
          // Nếu không phải ID, chỉ tìm theo tiêu đề
          filter.$or = [{ title: { $regex: search, $options: "i" } }];
        }
      }

      // Lọc theo khoảng thời gian
      if (dateRange || (startDate && endDate)) {
        const now = new Date();

        if (dateRange === "7") {
          // 7 ngày gần đây
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          filter.createdAt = { $gte: sevenDaysAgo };
        } else if (dateRange === "30") {
          // 30 ngày gần đây
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          filter.createdAt = { $gte: thirtyDaysAgo };
        } else if (dateRange === "custom" && startDate && endDate) {
          // Khoảng thời gian tùy chọn
          const startDateTime = new Date(startDate as string);
          const endDateTime = new Date(endDate as string);
          // Đặt thời gian kết thúc là cuối ngày
          endDateTime.setHours(23, 59, 59, 999);
          filter.createdAt = { $gte: startDateTime, $lte: endDateTime };
        }
      }

      console.log("Filter for getMyPosts:", filter);

      const posts = await Post.find(filter)
        .populate("author", "username email avatar")
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Map location code to name for each post
      const postsWithLocationName = await Promise.all(
        posts.map(async (post) => {
          const loc = post.location;
          let locationWithName = loc;
          if (
            loc &&
            loc.province &&
            loc.ward &&
            !isNaN(Number(loc.province)) &&
            !isNaN(Number(loc.ward))
          ) {
            const province = await ProvinceModel.findOne({
              code: Number(loc.province),
            });

            const ward = await WardModel.findOne({
              code: Number(loc.ward),
              parent_code: loc.province,
            });
            locationWithName = {
              province: province?.name || loc.province,
              ward: ward?.name || loc.ward,
              street: loc.street || "",
            };
          }
          return {
            ...post.toObject(),
            location: locationWithName,
          };
        })
      );

      const totalPosts = await Post.countDocuments(filter);

      res.json({
        success: true,
        data: {
          posts: postsWithLocationName,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalItems: totalPosts,
            itemsPerPage: limit,
          },
          filters: {
            // Trả về thông tin bộ lọc để frontend có thể hiển thị
            status: status || "all",
            type: type || "all",
            search: search || "",
            dateRange: dateRange || "",
            startDate: startDate || "",
            endDate: endDate || "",
          },
        },
      });
    } catch (error) {
      console.error("Get my posts error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Lấy danh sách bài đăng của user bất kỳ (chỉ cho admin)
  async getPostsByUser(req: AuthenticatedRequest, res: Response) {
    try {
      // Kiểm tra quyền admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Admin only",
        });
      }
      const userId = req.params.userId || req.query.userId;
      if (!userId || !mongoose.Types.ObjectId.isValid(userId as string)) {
        return res.status(400).json({
          success: false,
          message: "Invalid or missing userId",
        });
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const posts = await Post.find({ author: userId })
        .populate("author", "username email avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPosts = await Post.countDocuments({ author: userId });

      res.json({
        success: true,
        data: {
          posts,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalItems: totalPosts,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Get posts by user error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get public posts by user - for user profile pages
  async getPublicPostsByUser(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      if (!userId || !mongoose.Types.ObjectId.isValid(userId as string)) {
        return res.status(400).json({
          success: false,
          message: "Invalid or missing userId",
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const status = (req.query.status as string) || "active";
      const skip = (page - 1) * limit;

      // Only show active posts for public view
      const query: any = {
        author: userId,
        status: status, // "active" by default
      };

      const posts = await Post.find(query)
        .populate("author", "username avatar")
        .populate("category", "name slug")
        .populate("location.province", "name")
        .populate("location.ward", "name")
        .select("-content") // Exclude full content for performance
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPosts = await Post.countDocuments(query);

      res.json({
        success: true,
        data: {
          posts,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalItems: totalPosts,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Get public posts by user error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Update post by ID (only for author)
  // Khi người dùng edit tin đăng, sẽ chuyển trạng thái về pending để admin duyệt lại
  async updatePost(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { postId } = req.params;

      console.log("🔄 POST UPDATE REQUEST");
      console.log("👤 User ID:", userId);
      console.log("📄 Post ID:", postId);
      console.log("📦 Request body:", JSON.stringify(req.body, null, 2));

      if (!userId || !postId || !mongoose.Types.ObjectId.isValid(postId)) {
        console.log("❌ Invalid request - missing userId or postId");
        return res.status(400).json({
          success: false,
          message: "Invalid request",
        });
      }

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Kiểm tra xem người dùng có phải là tác giả của bài đăng không
      if (post.author.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You are not the author of this post",
        });
      }

      // Lưu trạng thái cũ để log
      const oldStatus = post.status;

      console.log("📖 Current post data BEFORE update:");
      console.log("🏠 houseDirection:", post.houseDirection);
      console.log("🌅 balconyDirection:", post.balconyDirection);
      console.log("🛣️ roadWidth:", post.roadWidth);
      console.log("🏠 frontWidth:", post.frontWidth);
      console.log("🛏️ bedrooms:", post.bedrooms);
      console.log("🚿 bathrooms:", post.bathrooms);
      console.log("🏢 floors:", post.floors);
      console.log("📄 legalDocs:", post.legalDocs);
      console.log("🪑 furniture:", post.furniture);
      console.log("📊 status:", post.status);

      // Cập nhật các trường cần thiết
      const updates = req.body;

      console.log("📝 Incoming updates:");
      console.log("🏠 houseDirection:", updates.houseDirection);
      console.log("🌅 balconyDirection:", updates.balconyDirection);
      console.log("🛣️ roadWidth:", updates.roadWidth);
      console.log("🏠 frontWidth:", updates.frontWidth);
      console.log("🛏️ bedrooms:", updates.bedrooms);
      console.log("🚿 bathrooms:", updates.bathrooms);
      console.log("🏢 floors:", updates.floors);
      console.log("📄 legalDocs:", updates.legalDocs);
      console.log("🪑 furniture:", updates.furniture);

      // Handle package field specifically
      if (updates.package) {
        post.package = updates.package;
      }

      // Handle images field specifically
      if (updates.images && Array.isArray(updates.images)) {
        post.images = updates.images;
        console.log(`📸 Updated post images: ${updates.images.length} images`);
      }

      const allowedUpdateKeys = Object.keys(updates).filter(
        (key) =>
          key !== "category" &&
          key !== "type" &&
          key !== "status" &&
          key !== "package" &&
          key !== "images" // Exclude images as we handle it separately
      );
      console.log("🔑 Allowed update keys:", allowedUpdateKeys);

      allowedUpdateKeys.forEach((key) => {
        console.log(
          `📝 Updating ${key}: ${(post as any)[key]} → ${updates[key]}`
        );
        // Use type assertion to avoid TS error
        (post as any)[key] = updates[key];
      });

      // QUAN TRỌNG: Chuyển trạng thái về pending để admin duyệt lại
      // Đặc biệt quan trọng: Khi tin bị từ chối và user sửa lại, cần chuyển về pending
      if (post.status === "rejected") {
        post.status = "pending";
        post.approvedAt = undefined;
        post.approvedBy = undefined;
        // GIỮ LẠI thông tin từ chối để người dùng tham khảo và admin theo dõi lịch sử
        // post.rejectedAt = undefined;
        // post.rejectedBy = undefined;
        // post.rejectedReason = undefined;
        console.log(
          `📝 Post ${postId} status changed from "rejected" to "pending" after user edit and resubmission`
        );
        console.log(
          `📋 Keeping rejection history: Rejected at ${post.rejectedAt} by ${post.rejectedBy} for reason: ${post.rejectedReason}`
        );
      } else if (post.status !== "draft") {
        // Các trạng thái khác (active, pending, etc.) cũng chuyển về pending khi edit
        post.status = "pending";
        post.approvedAt = undefined;
        post.approvedBy = undefined;
        console.log(
          `📝 Post ${postId} status changed from "${oldStatus}" to "pending" after user edit`
        );
      }

      await post.save();

      console.log("📖 POST DATA AFTER UPDATE:");
      console.log("🏠 houseDirection:", post.houseDirection);
      console.log("🌅 balconyDirection:", post.balconyDirection);
      console.log("🛣️ roadWidth:", post.roadWidth);
      console.log("🏠 frontWidth:", post.frontWidth);
      console.log("🛏️ bedrooms:", post.bedrooms);
      console.log("🚿 bathrooms:", post.bathrooms);
      console.log("🏢 floors:", post.floors);
      console.log("📄 legalDocs:", post.legalDocs);
      console.log("🪑 furniture:", post.furniture);
      console.log("📊 status:", post.status);

      console.log(`✅ Post ${postId} updated successfully by user ${userId}`);

      res.json({
        success: true,
        message: "Post updated successfully. Your post will be reviewed again.",
        data: { post },
      });
    } catch (error) {
      console.error("Update post error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Resubmit post for approval (only for post author)
  async resubmitPost(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { postId } = req.params;

      if (!userId || !postId || !mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
        });
      }

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Kiểm tra xem người dùng có phải là tác giả của bài đăng không
      if (post.author.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You are not the author of this post",
        });
      }

      // Chỉ cho phép resubmit những tin có status là rejected hoặc expired
      if (post.status !== "rejected" && post.status !== "expired") {
        return res.status(400).json({
          success: false,
          message: "Only rejected or expired posts can be resubmitted",
        });
      }

      // Cập nhật các trường được phép
      const updates = req.body;

      // Handle package field specifically
      if (updates.package) {
        post.package = updates.package;
      }

      // Handle images field specifically
      if (updates.images && Array.isArray(updates.images)) {
        post.images = updates.images;
        console.log(
          `📸 Updated post images during resubmit: ${updates.images.length} images`
        );
      }

      const allowedUpdateKeys = Object.keys(updates).filter(
        (key) =>
          key !== "category" &&
          key !== "type" &&
          key !== "status" &&
          key !== "package" &&
          key !== "images" && // Exclude images as we handle it separately
          key !== "author" &&
          key !== "createdAt" &&
          key !== "updatedAt"
      );
      allowedUpdateKeys.forEach((key) => {
        (post as any)[key] = updates[key];
      });

      // Đặt lại trạng thái về pending (chờ duyệt)
      post.status = "pending"; // pending
      // GIỮ LẠI thông tin từ chối để theo dõi lịch sử
      // post.rejectedAt = undefined;
      // post.rejectedBy = undefined;
      // post.rejectedReason = undefined;
      post.updatedAt = new Date();

      console.log(
        `📝 Post ${postId} resubmitted for approval. Previous rejection: ${post.rejectedReason}`
      );

      await post.save();

      res.json({
        success: true,
        message: "Post resubmitted for approval successfully",
        data: { post },
      });
    } catch (error) {
      console.error("Resubmit post error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // update post status (only admin and employee)
  async updatePostStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { postId } = req.params;
      const { status } = req.body;

      if (!userId || !postId || !mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
        });
      }

      // Kiểm tra quyền admin hoặc employee
      if (req.user?.role !== "admin" && req.user?.role !== "employee") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Admin or Employee only",
        });
      }

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Lưu trạng thái cũ để so sánh
      const oldStatus = post.status;

      // Cập nhật trạng thái bài đăng
      post.status = status;

      // Thêm thông tin admin duyệt/từ chối
      if (status === "active") {
        post.approvedAt = new Date();
        post.approvedBy = new mongoose.Types.ObjectId(userId);
        post.rejectedAt = undefined;
        post.rejectedBy = undefined;
        post.rejectedReason = undefined;
      } else if (status === "rejected") {
        post.rejectedAt = new Date();
        post.rejectedBy = new mongoose.Types.ObjectId(userId);
        post.rejectedReason = req.body.reason || "Không đạt yêu cầu";
        post.approvedAt = undefined;
        post.approvedBy = undefined;
      }

      await post.save();

      // Gửi notification tương ứng với trạng thái mới
      try {
        if (status === "active" && oldStatus !== "active") {
          console.log(
            `📨 Sending post approval notification for post ${postId}`
          );
          await NotificationService.createPostApprovedNotification(
            post.author.toString(),
            post.title.toString(),
            post._id.toString()
          );
        } else if (status === "rejected" && oldStatus !== "rejected") {
          console.log(
            `📨 Sending post rejection notification for post ${postId}`
          );
          await NotificationService.createPostRejectedNotification(
            post.author.toString(),
            post.title.toString(),
            post._id.toString(),
            post.rejectedReason?.toString()
          );
        }
      } catch (error) {
        console.error("❌ Error sending notification:", error);
        // Không fail request vì notification error
      }

      console.log(
        `✅ Post ${postId} status updated from "${oldStatus}" to "${status}" by ${userId}`
      );

      res.json({
        success: true,
        message: "Post status updated successfully",
        data: { post },
      });
    } catch (error) {
      console.error("Update post status error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async convertPriceSlugToRange(
    priceSlug: string
  ): Promise<{ min?: number; max?: number } | null> {
    console.log(`Converting price slug: "${priceSlug}"`);

    try {
      // First, try to find the price range in database by slug
      const priceRange = await PriceRange.findOne({
        slug: priceSlug.toLowerCase(),
        isActive: true,
      });

      if (priceRange) {
        console.log(`Found price range in database for "${priceSlug}":`, {
          name: priceRange.name,
          type: priceRange.type,
          minValue: priceRange.minValue,
          maxValue: priceRange.maxValue,
        });

        const result: { min?: number; max?: number } = {};

        // Set minimum value if exists and > 0
        if (priceRange.minValue && priceRange.minValue > 0) {
          result.min = priceRange.minValue;
        }

        // Set maximum value if exists and not -1 (unlimited)
        if (priceRange.maxValue && priceRange.maxValue !== -1) {
          result.max = priceRange.maxValue;
        }

        console.log(`Converted to range:`, result);
        return result;
      }

      // Fallback: If not found in database, try to extract from common slug patterns
      console.log(
        `Price range not found in database for "${priceSlug}", trying pattern matching...`
      );

      // Pattern for ranges like "thue-5-10-trieu"
      const rangeMatch = priceSlug.match(/(\d+)-(\d+)-(trieu|ty)/);
      if (rangeMatch) {
        const [, min, max, unit] = rangeMatch;
        const multiplier = unit === "ty" ? 1000000000 : 1000000; // 1 tỷ hoặc 1 triệu

        const result = {
          min: parseInt(min) * multiplier,
          max: parseInt(max) * multiplier,
        };

        console.log(`Extracted from pattern "${priceSlug}":`, result);
        return result;
      }

      // Pattern for "under" ranges like "thue-duoi-5-trieu"
      const underMatch = priceSlug.match(/duoi-(\d+)-(trieu|ty)/);
      if (underMatch) {
        const [, max, unit] = underMatch;
        const multiplier = unit === "ty" ? 1000000000 : 1000000;

        const result = {
          max: parseInt(max) * multiplier,
        };

        console.log(`Extracted "under" pattern from "${priceSlug}":`, result);
        return result;
      }

      // Pattern for "over" ranges like "thue-tren-50-trieu"
      const overMatch = priceSlug.match(/tren-(\d+)-(trieu|ty)/);
      if (overMatch) {
        const [, min, unit] = overMatch;
        const multiplier = unit === "ty" ? 1000000000 : 1000000;

        const result = {
          min: parseInt(min) * multiplier,
        };

        console.log(`Extracted "over" pattern from "${priceSlug}":`, result);
        return result;
      }

      // Special cases
      if (priceSlug.includes("thoa-thuan")) {
        console.log(`Negotiable price detected for "${priceSlug}"`);
        return {}; // Empty object means no price filter
      }

      console.log(`No price range found for slug: "${priceSlug}"`);
      return null;
    } catch (error) {
      console.error(`Error converting price slug "${priceSlug}":`, error);

      // Fallback to basic pattern matching if database query fails
      console.log(`Database query failed, using fallback for "${priceSlug}"`);

      // Basic fallback patterns for common cases
      const fallbackRanges: { [key: string]: { min?: number; max?: number } } =
        {
          "thue-5-10-trieu": { min: 5000000, max: 10000000 },
          "thue-duoi-5-trieu": { max: 5000000 },
          "thue-tren-20-trieu": { min: 20000000 },
          "ban-duoi-500-trieu": { max: 500000000 },
          "ban-1-2-ty": { min: 1000000000, max: 2000000000 },
          "ban-tren-5-ty": { min: 5000000000 },
        };

      const fallback = fallbackRanges[priceSlug.toLowerCase()];
      if (fallback) {
        console.log(`Using fallback range for "${priceSlug}":`, fallback);
        return fallback;
      }

      return null;
    }
  }

  async convertAreaSlugToRange(
    areaSlug: string
  ): Promise<{ min?: number; max?: number } | null> {
    console.log(`Converting area slug: "${areaSlug}"`);

    try {
      // First, try to find the area range in database by slug
      const Area = (await import("../models")).Area;
      const areaRange = await Area.findOne({
        slug: areaSlug.toLowerCase(),
        isActive: true,
      });

      if (areaRange) {
        console.log(`Found area range in database for "${areaSlug}":`, {
          name: areaRange.name,
          minValue: areaRange.minValue,
          maxValue: areaRange.maxValue,
        });

        const result: { min?: number; max?: number } = {};

        // Set minimum value if exists and > 0
        if (areaRange.minValue && areaRange.minValue > 0) {
          result.min = areaRange.minValue;
        }

        // Set maximum value if exists and not -1 (unlimited)
        if (areaRange.maxValue && areaRange.maxValue !== -1) {
          result.max = areaRange.maxValue;
        }

        console.log(`Converted area range for "${areaSlug}":`, result);
        return result;
      }

      // Fallback: If not found in database, try to extract from common slug patterns
      console.log(
        `Area range not found in database for "${areaSlug}", trying pattern matching...`
      );

      // Pattern for ranges like "30-50-m2"
      const rangeMatch = areaSlug.match(/(\d+)-(\d+)-m2/);
      if (rangeMatch) {
        const [, min, max] = rangeMatch;
        const result = {
          min: parseInt(min),
          max: parseInt(max),
        };
        console.log(`Extracted area from pattern "${areaSlug}":`, result);
        return result;
      }

      // Pattern for "under" ranges like "duoi-30-m2"
      const underMatch = areaSlug.match(/duoi-(\d+)-m2/);
      if (underMatch) {
        const [, max] = underMatch;
        const result = { max: parseInt(max) };
        console.log(`Extracted area from under pattern "${areaSlug}":`, result);
        return result;
      }

      // Pattern for "over" ranges like "tren-500-m2"
      const overMatch = areaSlug.match(/tren-(\d+)-m2/);
      if (overMatch) {
        const [, min] = overMatch;
        const result = { min: parseInt(min) };
        console.log(`Extracted area from over pattern "${areaSlug}":`, result);
        return result;
      }

      console.log(`No area range found for slug: "${areaSlug}"`);
      return null;
    } catch (error) {
      console.error(`Error converting area slug "${areaSlug}":`, error);
      return null;
    }
  }

  async convertLocationSlugToCode(
    locationParam: string | undefined
  ): Promise<string | null> {
    // Kiểm tra undefined
    if (!locationParam) {
      return null;
    }
    console.log(`Converting location slug: "${locationParam}"`);

    // Nếu đã là code số, trả về luôn
    if (!isNaN(Number(locationParam))) {
      console.log(`Already a numeric code: ${locationParam}`);
      return locationParam;
    }

    // Chuyển đổi từ slug sang code
    try {
      // Normalize slug để so sánh (chuyển từ hyphen sang underscore)
      const normalizedSlug = locationParam.replace(/-/g, "_");
      console.log(`Normalized slug: "${normalizedSlug}"`);

      // Debug: Check what provinces are available in database
      const allProvinces = await ProvinceModel.find({}).limit(5);
      console.log(
        `Sample provinces in DB:`,
        allProvinces.map((p) => ({
          name: p.name,
          slug: p.slug,
          code: p.code,
        }))
      );

      // Tìm trong provinces trước
      const province = await ProvinceModel.findOne({ slug: normalizedSlug });
      if (province) {
        console.log(
          `Found province match by slug: "${province.name}" -> code ${province.code}`
        );
        return province.code?.toString() || null;
      }

      // If not found with underscore, try with original hyphen format
      const provinceWithHyphen = await ProvinceModel.findOne({
        slug: locationParam,
      });
      if (provinceWithHyphen) {
        console.log(
          `Found province match with hyphen slug: "${provinceWithHyphen.name}" -> code ${provinceWithHyphen.code}`
        );
        return provinceWithHyphen.code?.toString() || null;
      }

      // Nếu không tìm thấy province, tìm trong wards
      const ward = await WardModel.findOne({ slug: normalizedSlug });
      if (ward) {
        console.log(
          `Found ward match by slug: "${ward.name}" -> code ${ward.code}`
        );
        return ward.code?.toString() || null;
      }

      console.log(
        `No match found for slug: "${locationParam}" (normalized: "${normalizedSlug}")`
      );
      return null;
    } catch (error) {
      console.error("Error converting location slug:", error);
      return null;
    }
  }

  // Tìm ward trong một tỉnh/thành phố cụ thể
  async convertWardSlugToCodeInDistrict(
    wardSlug: string,
    districtCode: string, // Giữ lại parameter này để không phải thay đổi các lời gọi hàm
    provinceCode: string
  ): Promise<string | null> {
    console.log(
      `Converting ward slug "${wardSlug}" in province ${provinceCode}`
    );

    if (!isNaN(Number(wardSlug))) {
      console.log(`Ward slug is already a numeric code: ${wardSlug}`);
      return wardSlug;
    }

    try {
      const normalizedSlug = wardSlug.replace(/-/g, "_");
      console.log(`Normalized ward slug: "${normalizedSlug}"`);

      // Debug: Check what wards are available in this province
      const sampleWards = await WardModel.find({
        parent_code: provinceCode,
      }).limit(3);
      console.log(
        `Sample wards in province ${provinceCode}:`,
        sampleWards.map((w) => ({
          name: w.name,
          slug: w.slug,
          code: w.code,
        }))
      );

      // Tìm ward trực tiếp qua parent_code (provinceCode) và slug với underscore
      let ward = await WardModel.findOne({
        parent_code: provinceCode,
        slug: normalizedSlug,
      });

      if (!ward) {
        // If not found with underscore, try with original hyphen format
        ward = await WardModel.findOne({
          parent_code: provinceCode,
          slug: wardSlug,
        });
      }

      if (!ward) {
        console.log(
          `Ward not found with slug: "${wardSlug}" (normalized: "${normalizedSlug}") in province ${provinceCode}`
        );
        return null;
      }

      console.log(`Found ward match: "${ward.name}" -> code ${ward.code}`);
      return ward.code?.toString() || null;
    } catch (error) {
      console.error("Error converting ward slug to code:", error);
      return null;
    }
  }

  // Lấy bài đăng theo api filters
  async searchPosts(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        type,
        category,
        city,
        province,
        districts,
        wards,
        price,
        area,
        propertyId,
        project,
      } = req.query;

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Use province parameter if available, otherwise fall back to city
      const locationParam = province || city;

      // 1. Log điều kiện tìm kiếm
      console.log("Search criteria:", {
        type,
        category,
        city,
        province,
        locationParam, // Show which parameter we're actually using
        wards,
        price,
        area,
        propertyId,
        project,
      });

      // 2. Xây dựng filter TRƯỚC khi truy vấn
      const filter: any = { status: "active" };

      // QUAN TRỌNG: Loại bỏ posts đã hết hạn
      const now = new Date();
      filter.$and = [
        {
          $or: [
            { expiredAt: { $exists: false } }, // Posts không có expiry date
            { expiredAt: null }, // Posts với expiry date = null
            { expiredAt: { $gt: now } }, // Posts chưa hết hạn
          ],
        },
      ];

      if (type) filter.type = type.toString();

      // Handle category - convert slug to ObjectId
      if (category) {
        try {
          // First try to find category by slug
          const categoryDoc = await Category.findOne({
            slug: category.toString(),
          });
          if (categoryDoc) {
            filter.category = categoryDoc._id;
            console.log(
              `Found category by slug "${category}":`,
              categoryDoc._id
            );
          } else {
            // If not found by slug, try as ObjectId
            if (mongoose.Types.ObjectId.isValid(category.toString())) {
              filter.category = new mongoose.Types.ObjectId(
                category.toString()
              );
              console.log(`Using category as ObjectId:`, category);
            } else {
              console.log(
                `Category "${category}" not found by slug and not valid ObjectId`
              );
              // Return empty result if category doesn't exist
              return res.json({
                success: true,
                data: {
                  posts: [],
                  pagination: {
                    currentPage: page,
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: limit,
                  },
                  searchCriteria: { category: category.toString() },
                },
              });
            }
          }
        } catch (error) {
          console.error("Error processing category:", error);
          filter.category = category.toString(); // Fallback to original behavior
        }
      }

      // Handle project filter
      if (project && project !== "all") {
        console.log("🔍 Project filter detected:", {
          project,
          type: typeof project,
          isValidObjectId: mongoose.Types.ObjectId.isValid(project as string),
        });

        if (mongoose.Types.ObjectId.isValid(project as string)) {
          const projectObjectId = new mongoose.Types.ObjectId(
            project as string
          );
          filter.project = projectObjectId;
          console.log("🔍 Added project filter to query:", {
            originalProject: project,
            convertedProject: projectObjectId,
            filterProject: filter.project,
          });
        } else {
          console.log("❌ Invalid project ObjectId:", project);
          return res.status(400).json({
            success: false,
            message: "Invalid project ID format",
          });
        }
      } else {
        console.log("🔍 No project filter or project = 'all':", project);
      }

      // Lưu lại cityCode để sử dụng cho ward lookup
      let cityCode: string | null = null;
      let provinceFilter: any = null;

      // Xử lý location (city or province) có thể là slug hoặc code
      if (locationParam) {
        console.log(`Processing location parameter: "${locationParam}"`);
        cityCode = await this.convertLocationSlugToCode(
          locationParam.toString()
        );
        if (cityCode) {
          console.log(
            `Location slug "${locationParam}" converted to code: ${cityCode}`
          );
          // Tìm cả theo code và tên
          const cityLocation = await ProvinceModel.findOne({
            code: Number(cityCode),
          });
          const cityName = cityLocation?.name;
          console.log(`Found location name: ${cityName} for code: ${cityCode}`);

          if (cityName) {
            provinceFilter = {
              $or: [
                { "location.province": cityCode },
                { "location.province": cityName },
              ],
            };
            console.log(
              `Prepared province filter with both code and name:`,
              provinceFilter
            );
          } else {
            provinceFilter = { "location.province": cityCode };
            console.log(`Prepared province filter with code only: ${cityCode}`);
          }
        } else {
          // If conversion failed, use the original parameter as fallback
          provinceFilter = { "location.province": locationParam.toString() };
          console.log(
            `Location conversion failed, using original parameter: "${locationParam}"`
          );
        }
      } // Lưu lại districtCodes để sử dụng cho ward lookup
      let districtCodes: string[] = [];

      // Xử lý districts có thể là slug hoặc code
      // Districts đã không còn trong mô hình mới, nhưng giữ lại biến districtCodes
      // để đảm bảo tương thích với các phần sau của mã
      if (districts) {
        console.log("Districts đã không còn trong mô hình mới:", districts);
        districtCodes = [];
      }

      // Xử lý wards có thể là slug hoặc code - QUAN TRỌNG: Tìm trong province cụ thể
      let wardFilter: any = null;

      if (wards) {
        console.log("Processing wards:", wards);
        console.log("Wards type:", typeof wards);
        const wardsList = wards.toString().split(",");
        console.log("Wards after split:", wardsList);
        if (wardsList.length > 0) {
          const wardCodes: string[] = [];

          for (const w of wardsList) {
            console.log(`Processing ward: "${w}"`);
            // Tìm ward dựa trên provinceCode
            if (cityCode) {
              console.log(`Looking for ward "${w}" in province ${cityCode}`);
              // Giữ lại districtCode để không phải thay đổi signature của hàm
              const code = await this.convertWardSlugToCodeInDistrict(
                w,
                "", // districtCode không còn cần thiết
                cityCode
              );
              if (code) {
                wardCodes.push(code);
                console.log(
                  `Ward slug "${w}" -> code "${code}" in province ${cityCode}`
                );
              } else {
                console.log(`Ward "${w}" not found in province ${cityCode}`);
              }
            } else {
              // Fallback về cách cũ nếu không có province context
              console.log(
                `No province context, using fallback conversion for ward "${w}"`
              );
              const code = await this.convertLocationSlugToCode(w);
              if (code) {
                wardCodes.push(code);
                console.log(`Ward slug "${w}" -> code "${code}" (fallback)`);
              } else {
                console.log(`Ward "${w}" not found in fallback conversion`);
              }
            }
          }

          if (wardCodes.length > 0) {
            wardFilter = { "location.ward": { $in: wardCodes } };
            console.log("Prepared ward filter:", wardFilter);
          } else {
            // If ward parameter was provided but no valid codes found,
            // set impossible condition to return no results (since specific ward was requested but doesn't exist)
            console.log(
              "Ward parameter provided but no valid codes found, setting impossible filter"
            );
            wardFilter = { "location.ward": { $in: ["__WARD_NOT_FOUND__"] } };
            console.log("Set impossible ward filter to return no results");
          }
        }
      }

      // Combine province and ward filters properly
      if (provinceFilter && wardFilter) {
        // Both province and ward specified - combine them with $and
        console.log("Combining province and ward filters with $and");
        console.log("Province filter:", JSON.stringify(provinceFilter));
        console.log("Ward filter:", JSON.stringify(wardFilter));

        // Handle the case where provinceFilter has $or condition
        if (provinceFilter.$or) {
          // Create a complex condition: (province condition) AND (ward condition)
          filter.$and = [
            ...(filter.$and || []),
            { $or: provinceFilter.$or },
            wardFilter,
          ];
        } else {
          // Simple case: combine both filters
          filter.$and = [...(filter.$and || []), provinceFilter, wardFilter];
        }

        console.log(
          "Combined location filter with $and:",
          JSON.stringify(filter.$and)
        );
      } else if (provinceFilter) {
        // Only province specified
        console.log("Applying province filter only");
        if (provinceFilter.$or) {
          // Handle $or condition properly - add to existing $and
          filter.$and = [...(filter.$and || []), { $or: provinceFilter.$or }];
          console.log(
            "Applied province $or filter to $and:",
            JSON.stringify(filter.$and)
          );
        } else {
          // Simple assignment for single field filters
          Object.assign(filter, provinceFilter);
          console.log(
            "Applied simple province filter:",
            JSON.stringify(provinceFilter)
          );
        }
      } else if (wardFilter) {
        // Only ward specified (rare case)
        console.log("Applying ward filter only");
        Object.assign(filter, wardFilter);
        console.log("Applied ward-only filter:", JSON.stringify(wardFilter));
      }

      // Handle price - support both numeric ranges and descriptive slugs
      if (price && typeof price === "string") {
        console.log(`Processing price parameter: "${price}"`);

        // Check if it's a numeric range format (e.g., "1000000-2000000")
        if (price.includes("-") && !isNaN(parseFloat(price.split("-")[0]))) {
          console.log("Price is in numeric range format");
          const [minPrice, maxPrice] = price.split("-");
          filter.price = {};
          if (minPrice && !isNaN(parseFloat(minPrice))) {
            filter.price.$gte = parseFloat(minPrice);
          }
          if (maxPrice && !isNaN(parseFloat(maxPrice))) {
            filter.price.$lte = parseFloat(maxPrice);
          }
        } else {
          // Handle descriptive price slugs (e.g., "ban-tren-15-ty")
          console.log("Price is in slug format, converting to numeric range");
          const priceRange = await this.convertPriceSlugToRange(price);
          if (priceRange) {
            filter.price = {};
            if (priceRange.min !== undefined) {
              filter.price.$gte = priceRange.min;
              console.log(`Set minimum price: ${priceRange.min}`);
            }
            if (priceRange.max !== undefined) {
              filter.price.$lte = priceRange.max;
              console.log(`Set maximum price: ${priceRange.max}`);
            }
            // If no min/max (like "thoa-thuan"), don't add price filter
            if (Object.keys(filter.price).length === 0) {
              delete filter.price;
              console.log("Price is negotiable, removed price filter");
            }
          } else {
            console.log(
              `Unknown price format: "${price}", ignoring price filter`
            );
          }
        }
      }

      // Handle area - support both numeric ranges and descriptive slugs
      if (area && typeof area === "string") {
        console.log(`Processing area parameter: "${area}"`);

        // Check if it's a numeric range format (e.g., "30-50")
        if (area.includes("-") && !isNaN(parseFloat(area.split("-")[0]))) {
          console.log("Area is in numeric range format");
          const [minArea, maxArea] = area.split("-");
          filter.area = {};
          if (minArea && !isNaN(parseFloat(minArea))) {
            filter.area.$gte = parseFloat(minArea);
          }
          if (maxArea && !isNaN(parseFloat(maxArea))) {
            filter.area.$lte = parseFloat(maxArea);
          }
        } else {
          // Handle descriptive area slugs (e.g., "30-50-m2", "duoi-30-m2")
          console.log("Area is in slug format, converting to numeric range");
          const areaRange = await this.convertAreaSlugToRange(area);
          if (areaRange) {
            filter.area = {};
            if (areaRange.min !== undefined) {
              filter.area.$gte = areaRange.min;
              console.log(`Set minimum area: ${areaRange.min}`);
            }
            if (areaRange.max !== undefined) {
              filter.area.$lte = areaRange.max;
              console.log(`Set maximum area: ${areaRange.max}`);
            }
            // If no min/max (like unlimited area), don't add area filter
            if (Object.keys(filter.area).length === 0) {
              delete filter.area;
              console.log("Area is unlimited, removed area filter");
            }
          } else {
            console.log(`Unknown area format: "${area}", ignoring area filter`);
          }
        }
      }

      // Handle propertyId
      if (propertyId) {
        try {
          const idArray = Array.isArray(propertyId) ? propertyId : [propertyId];

          const validIds = idArray
            .filter((id) => mongoose.Types.ObjectId.isValid(id.toString()))
            .map((id) => new mongoose.Types.ObjectId(id.toString()));

          if (validIds.length > 0) {
            filter._id = { $in: validIds };
          }
        } catch (error) {
          console.warn("Invalid propertyId format:", error);
        }
      }

      // 3. Log filter để debug
      console.log("Search filter:", JSON.stringify(filter));

      // 4. Thực hiện truy vấn SAU KHI đã xây dựng filter đầy đủ
      const totalPosts = await Post.countDocuments(filter);
      console.log(`Total posts found with filter: ${totalPosts}`);

      // Debug: Check some existing posts to see their location format
      if (totalPosts === 0) {
        console.log("No posts found, checking existing posts format...");
        const samplePosts = await Post.find({ status: "active" }).limit(3);
        console.log(
          "Sample posts locations:",
          samplePosts.map((p) => ({
            id: p._id,
            location: p.location,
          }))
        );

        return res.json({
          success: true,
          data: {
            posts: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: limit,
            },
            searchCriteria: {
              type,
              category,
              province: locationParam,
              wards,
              price,
              area,
            },
          },
        });
      }

      const posts = await Post.find(filter)
        .populate("author", "username email avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      console.log(`Found ${posts.length} posts matching criteria`);

      // 5. Map location code sang name
      const postsWithLocationName = await Promise.all(
        posts.map(async (post) => {
          const loc = post.location;
          let locationWithName = loc;

          // Convert location codes to names if we have province
          if (loc && loc.province) {
            // Check if province is a numeric code
            if (!isNaN(Number(loc.province))) {
              const province = await ProvinceModel.findOne({
                code: Number(loc.province),
              });

              if (province) {
                let wardName = loc.ward || "";

                // Convert ward code to name if it exists and is numeric
                if (loc.ward && !isNaN(Number(loc.ward))) {
                  const ward = await WardModel.findOne({
                    code: Number(loc.ward),
                    parent_code: loc.province,
                  });
                  if (ward) {
                    wardName = ward.name || loc.ward;
                  }
                }

                locationWithName = {
                  province: province?.name || loc.province,
                  ward: wardName,
                  street: loc.street || "",
                };
              }
            }
          }

          return {
            ...post.toObject(),
            location: locationWithName,
          };
        })
      );

      console.log(
        `Returning ${postsWithLocationName.length} posts with location names`
      );

      res.json({
        success: true,
        data: {
          posts: postsWithLocationName,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalItems: totalPosts,
            itemsPerPage: limit,
          },
          searchCriteria: {
            type,
            category,
            province: locationParam,
            wards,
            price,
            area,
          },
        },
      });
    } catch (error) {
      console.error("Search posts error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Utility method để mark expired posts khi cần
  async markExpiredPosts() {
    try {
      const now = new Date();
      const result = await Post.updateMany(
        {
          status: "active",
          expiredAt: { $lt: now, $ne: null },
        },
        {
          $set: { status: "expired" },
        }
      );

      console.log(`Marked ${result.modifiedCount} posts as expired`);
      return result.modifiedCount;
    } catch (error) {
      console.error("Error marking expired posts:", error);
      return 0;
    }
  }

  // Admin endpoint để manually check và mark expired posts
  async checkExpiredPosts(req: AuthenticatedRequest, res: Response) {
    try {
      // Chỉ admin mới có thể sử dụng
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin only.",
        });
      }

      const expiredCount = await this.markExpiredPosts();

      res.json({
        success: true,
        message: `Successfully checked and marked ${expiredCount} expired posts`,
        data: {
          expiredCount,
        },
      });
    } catch (error) {
      console.error("Check expired posts error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Gia hạn tin đăng
  async extendPost(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { postId } = req.params;
      const { packageId } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      if (!packageId) {
        return res.status(400).json({
          success: false,
          message: "Package ID is required",
        });
      }

      // Tìm post của user
      const post = await Post.findOne({
        _id: postId,
        author: userId,
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found or you don't have permission",
        });
      }

      // Tìm package info
      const packageInfo = await Package.findById(packageId);
      if (!packageInfo || !packageInfo.isActive) {
        return res.status(404).json({
          success: false,
          message: "Package not found or inactive",
        });
      }

      // Kiểm tra số dư ví của user
      const userWallet = await Wallet.findOne({ userId });
      if (!userWallet) {
        return res.status(404).json({
          success: false,
          message: "User wallet not found",
        });
      }

      if (userWallet.balance < packageInfo.price) {
        return res.status(400).json({
          success: false,
          message: "Insufficient wallet balance",
        });
      }

      // Trừ tiền từ ví
      userWallet.balance -= packageInfo.price;
      await userWallet.save();

      // Tạo payment record
      const orderId = `EXTEND_${postId}_${Date.now()}`;
      const payment = new Payment({
        userId,
        postId: post._id,
        orderId,
        amount: packageInfo.price,
        currency: "VND",
        paymentMethod: "wallet",
        status: "completed",
        description: `Gia hạn tin đăng: ${post.title}`,
        completedAt: new Date(),
        metadata: {
          postId: post._id,
          packageId: packageInfo._id,
          packageName: packageInfo.name,
          duration: packageInfo.duration,
          type: "post_extend",
        },
      });
      await payment.save();

      // Tính toán expiry date mới
      const now = new Date();
      const currentExpiry = post.expiredAt ? new Date(post.expiredAt) : now;

      // Nếu post đã hết hạn, tính từ hiện tại. Nếu chưa, tính từ expiry date hiện tại
      const startDate = currentExpiry > now ? currentExpiry : now;
      const newExpiryDate = new Date(
        startDate.getTime() + packageInfo.duration * 24 * 60 * 60 * 1000
      );

      // Cập nhật post
      post.expiredAt = newExpiryDate;
      post.packageId = packageId;
      post.originalPackageDuration = packageInfo.duration;

      // Nếu post đã expired, set status thành pending để chờ duyệt lại
      if (post.status === "expired") {
        post.status = "pending";
      }

      await post.save();

      console.log(
        `📅 Post extended: ${post.title}, Package: ${packageInfo.name}, New expiry: ${newExpiryDate}`
      );

      res.json({
        success: true,
        message: "Post extended successfully",
        data: {
          post: {
            _id: post._id,
            expiredAt: post.expiredAt,
            packageId: post.packageId,
            status: post.status,
          },
        },
      });
    } catch (error) {
      console.error("Extend post error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get similar posts based on project or location
  async getSimilarPosts(req: AuthenticatedRequest, res: Response) {
    try {
      const { postId } = req.params;
      const limit = parseInt(req.query.limit as string) || 6;

      console.log(
        `🔍 Getting similar posts for post ID: ${postId} with limit: ${limit}`
      );

      // Get the current post
      const currentPost = await Post.findById(postId)
        .populate("category", "name slug")
        .populate("author", "name email");

      if (!currentPost) {
        return res.status(404).json({
          success: false,
          message: "Bài viết không tồn tại",
        });
      }

      // Log để debug thông tin vị trí
      console.log(
        "Current post location:",
        JSON.stringify(currentPost.location)
      );

      let similarPosts: any[] = [];
      let searchCriteria = ""; // Lưu thông tin tiêu chí tìm kiếm đã sử dụng

      // Nếu là bài đăng thuộc dự án thì chỉ tìm các bài đăng cùng dự án
      if (currentPost.project) {
        console.log(
          "🔍 Bài đăng thuộc dự án. Tìm bài đăng cùng dự án:",
          currentPost.project
        );

        // Build the query for project search
        const projectQuery = {
          _id: { $ne: postId }, // Exclude current post
          project: currentPost.project,
          status: "active",
        };

        // Log the project search query
        console.log("Project search query:", JSON.stringify(projectQuery));

        // Count posts matching this criteria before executing the full query
        const projectPostsCount = await Post.countDocuments(projectQuery);
        console.log(
          `Found ${projectPostsCount} total posts matching project criteria`
        );

        similarPosts = await Post.find(projectQuery)
          .populate("category", "name slug")
          .populate("author", "name email")
          .populate("project", "name slug")
          .sort({ createdAt: -1 })
          .limit(limit);

        console.log(`Retrieved ${similarPosts.length} posts in same project`);
        searchCriteria = "project";
      }
      // Nếu không phải là bài đăng thuộc dự án thì tìm theo vị trí
      else {
        // Tìm kiếm theo phường trước
        if (currentPost.location?.ward) {
          console.log(
            "🔍 Bài đăng không thuộc dự án. Tìm bài đăng cùng phường:",
            currentPost.location.ward
          );

          // Build the query for ward search
          const wardQuery = {
            _id: { $ne: postId },
            "location.ward": currentPost.location.ward,
            status: "active",
            project: null, // Chỉ tìm các bài đăng không thuộc dự án
          };

          // Log the ward search query
          console.log("Ward search query:", JSON.stringify(wardQuery));

          // Count posts matching this criteria before executing the full query
          const wardPostsCount = await Post.countDocuments(wardQuery);
          console.log(
            `Found ${wardPostsCount} total posts matching ward criteria`
          );

          similarPosts = await Post.find(wardQuery)
            .populate("category", "name slug")
            .populate("author", "name email")
            .populate("project", "name slug")
            .sort({ createdAt: -1 })
            .limit(limit);

          console.log(`Retrieved ${similarPosts.length} posts in same ward`);
          searchCriteria = "ward";
        }

        // Không cần tìm kiếm theo district nữa vì đã không còn trong mô hình mới
        // Giữ lại searchCriteria để không ảnh hưởng đến logic sau
        if (similarPosts.length < limit) {
          console.log(
            "🔍 Bỏ qua tìm kiếm theo quận/huyện do đã thay đổi mô hình location"
          );

          // Không còn tìm kiếm theo district nữa
          if (searchCriteria === "ward") {
            // Giữ nguyên searchCriteria
          }
        }
      }

      // Nếu vẫn không đủ bài đăng, tìm theo category và type
      if (similarPosts.length < limit) {
        console.log("🔍 Không đủ bài đăng tương tự, tìm theo loại và danh mục");

        // Build the query for category search
        const categoryQuery = {
          _id: { $ne: postId },
          category: currentPost.category,
          type: currentPost.type,
          status: "active",
          ...(currentPost.project
            ? { project: { $ne: currentPost.project } }
            : {}),
        };

        // Log the category search query
        console.log("Category search query:", JSON.stringify(categoryQuery));

        // Count posts matching this criteria before executing the full query
        const categoryPostsCount = await Post.countDocuments(categoryQuery);
        console.log(
          `Found ${categoryPostsCount} total posts matching category criteria`
        );

        const categoryPosts = await Post.find(categoryQuery)
          .populate("category", "name slug")
          .populate("author", "name email")
          .populate("project", "name slug")
          .sort({ createdAt: -1 })
          .limit(limit - similarPosts.length);

        console.log(
          `Retrieved ${categoryPosts.length} posts with same category and type`
        );
        similarPosts = [...similarPosts, ...categoryPosts];

        if (searchCriteria === "" && categoryPosts.length > 0) {
          searchCriteria = "category";
        }
      }

      // Remove duplicates and limit results
      const uniquePosts = similarPosts
        .filter(
          (post, index, self) =>
            index ===
            self.findIndex((p) => p._id.toString() === post._id.toString())
        )
        .slice(0, limit);

      console.log(
        `Final similar posts count: ${uniquePosts.length} out of total ${similarPosts.length}`
      );

      // Log the IDs of the similar posts for debugging
      console.log(
        "Final similar post IDs:",
        uniquePosts.map((post) => post._id.toString())
      );

      // Cập nhật thông tin tiêu chí tìm kiếm dựa trên kết quả thực tế
      const criteriaResponse = {
        searchMethod: searchCriteria, // Tiêu chí đã sử dụng để tìm kiếm
        hasProject: !!currentPost.project,
        ward: currentPost.location?.ward,
        province: currentPost.location?.province,
        category: currentPost.category,
        type: currentPost.type,
      };

      res.json({
        success: true,
        data: {
          posts: uniquePosts,
          total: uniquePosts.length,
          criteria: criteriaResponse,
        },
      });
    } catch (error) {
      console.error("Get similar posts error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy tin đăng tương tự",
      });
    }
  }

  // Increment post views
  async incrementViews(req: AuthenticatedRequest, res: Response) {
    try {
      const { postId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid post ID format",
        });
      }

      const post = await Post.findByIdAndUpdate(
        postId,
        { $inc: { views: 1 } },
        { new: true }
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      res.json({
        success: true,
        data: { views: post.views },
      });
    } catch (error) {
      console.error("Increment views error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get posts by user with filters (public posts only)
  async getUserPublicPosts(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      const {
        type,
        page = 1,
        limit = 12,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      // Build filter
      const filter: any = {
        user: userId,
        status: "active", // Only active posts for public view
      };

      if (type && type !== "all") {
        filter.type = type;
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build sort
      const sort: any = {};
      sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

      // Get posts with user info
      const posts = await Post.find(filter)
        .populate("user", "username avatar")
        .populate("category", "name slug")
        .populate("project", "name")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean();

      // Get total count
      const total = await Post.countDocuments(filter);

      res.json({
        success: true,
        data: {
          posts,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalPosts: total,
            hasMore: total > pageNum * limitNum,
          },
        },
      });
    } catch (error) {
      console.error("Get user public posts error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get user posts stats (public)
  async getUserPostsStats(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      // Get stats for active posts only
      const stats = await Post.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            status: "active",
          },
        },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
      ]);

      // Get total active posts
      const totalActive = await Post.countDocuments({
        user: userId,
        status: "active",
      });

      // Get total posts (all statuses)
      const totalPosts = await Post.countDocuments({
        user: userId,
      });

      const result = {
        totalPosts,
        totalActive,
        sellPosts: 0,
        rentPosts: 0,
      };

      stats.forEach((stat) => {
        if (stat._id === "ban") {
          result.sellPosts = stat.count;
        } else if (stat._id === "cho-thue") {
          result.rentPosts = stat.count;
        }
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get user posts stats error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get featured posts (VIP/Premium posts for homepage)
  async getFeaturedPosts(req: AuthenticatedRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 8;

      // Build aggregation pipeline to get featured posts
      const pipeline: any[] = [
        {
          $match: {
            status: "active",
          },
        },
        {
          $addFields: {
            // Calculate priority score for sorting
            priorityScore: {
              $switch: {
                branches: [
                  { case: { $eq: ["$priority", "vip"] }, then: 4 },
                  { case: { $eq: ["$priority", "premium"] }, then: 3 },
                  { case: { $eq: ["$priority", "normal"] }, then: 2 },
                ],
                default: 1,
              },
            },
            packageScore: {
              $switch: {
                branches: [
                  { case: { $eq: ["$package", "vip"] }, then: 4 },
                  { case: { $eq: ["$package", "premium"] }, then: 3 },
                  { case: { $eq: ["$package", "basic"] }, then: 2 },
                ],
                default: 1,
              },
            },
          },
        },
        {
          $sort: {
            priorityScore: -1,
            packageScore: -1,
            createdAt: -1,
          },
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "author",
            pipeline: [
              {
                $project: {
                  username: 1,
                  email: 1,
                  avatar: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$author",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
            pipeline: [
              {
                $project: {
                  name: 1,
                  slug: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            priorityScore: 0,
            packageScore: 0,
          },
        },
      ];

      const posts = await Post.aggregate(pipeline);

      console.log(`Found ${posts.length} featured posts`);

      res.json({
        success: true,
        data: {
          posts,
          total: posts.length,
        },
      });
    } catch (error) {
      console.error("Get featured posts error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
