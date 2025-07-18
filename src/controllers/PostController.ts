import { Response } from "express";
import { Post, Package, Category } from "../models";
import { AuthenticatedRequest } from "../middleware";
import mongoose from "mongoose";
import { LocationModel } from "../models/Location";
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
        contactName,
        email,
        phone,
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

      if (
        !parsedLocation ||
        !parsedLocation.province ||
        !parsedLocation.district ||
        !parsedLocation.ward
      ) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin địa chỉ (province, district, ward)",
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

      // Convert category name to ObjectId
      let categoryId;
      if (mongoose.Types.ObjectId.isValid(category)) {
        // If already an ObjectId, use it directly
        categoryId = category;
        console.log(`✅ Category is already ObjectId: ${categoryId}`);
      } else {
        // If category name, find the category by name
        console.log(`🔍 Looking for category with name: "${category}"`);
        const categoryDoc = await Category.findOne({ name: category });
        console.log(`📝 Category found:`, categoryDoc);
        if (!categoryDoc) {
          console.log(`❌ Category "${category}" not found in database`);
          return res.status(400).json({
            success: false,
            message: `Category "${category}" not found`,
          });
        }
        categoryId = categoryDoc._id;
        console.log(`✅ Category ID found: ${categoryId}`);
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
        contactName,
        email,
        phone,
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

      const { category, status, search, author } = req.query;

      // Build filter object
      const filter: any = {};

      if (category) filter.category = category;
      if (status) filter.status = status;
      if (author && mongoose.Types.ObjectId.isValid(author as string)) {
        filter.author = author;
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

      const posts = await Post.find(filter)
        .populate("author", "username email avatar")
        .populate("category", "name slug")
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
        const districtCode = post.location.district;
        const wardCode = post.location.ward;

        if (provinceCode && !isNaN(Number(provinceCode))) {
          const province = await LocationModel.findOne({
            code: Number(provinceCode),
          });

          if (province) {
            let districtName = districtCode;
            let wardName = wardCode;

            if (districtCode && !isNaN(Number(districtCode))) {
              const district = province.districts.find(
                (d: any) => d.code === Number(districtCode)
              );
              if (district) {
                districtName = district.name || districtCode;

                if (wardCode && !isNaN(Number(wardCode))) {
                  const ward = district.wards.find(
                    (w: any) => w.code === Number(wardCode)
                  );
                  if (ward) {
                    wardName = ward.name || wardCode;
                  }
                }
              }
            }

            locationWithName = {
              province: province.name || provinceCode,
              district: districtName || districtCode,
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
            loc.district &&
            loc.ward &&
            !isNaN(Number(loc.province)) &&
            !isNaN(Number(loc.district)) &&
            !isNaN(Number(loc.ward))
          ) {
            const province = await LocationModel.findOne({
              code: Number(loc.province),
            });
            const district = province?.districts.find(
              (d: any) => d.code === Number(loc.district)
            );
            const ward = district?.wards.find(
              (w: any) => w.code === Number(loc.ward)
            );
            locationWithName = {
              province: province?.name || loc.province,
              district: district?.name || loc.district,
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

  // Update post by ID (only for author)
  // Khi người dùng edit tin đăng, sẽ chuyển trạng thái về pending để admin duyệt lại
  async updatePost(req: AuthenticatedRequest, res: Response) {
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

      // Lưu trạng thái cũ để log
      const oldStatus = post.status;

      // Cập nhật các trường cần thiết
      const updates = req.body;

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
      allowedUpdateKeys.forEach((key) => {
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
      // Tìm trong tất cả các tỉnh/thành với districts và wards
      const allLocations = await LocationModel.find({});
      console.log(`Found ${allLocations.length} locations to search`);

      // Normalize slug để so sánh (chuyển từ hyphen sang underscore)
      const normalizedSlug = locationParam.replace(/-/g, "_");
      console.log(`Normalized slug: "${normalizedSlug}"`);

      // Tìm trong provinces
      for (const location of allLocations) {
        // So sánh với codename có sẵn trong database
        if (location.codename === normalizedSlug) {
          console.log(
            `Found province match by codename: "${location.name}" -> code ${location.code}`
          );
          return location.code?.toString() || null;
        }

        // Tìm trong districts
        if (location.districts) {
          for (const district of location.districts) {
            if (district.codename === normalizedSlug) {
              console.log(
                `Found district match by codename: "${district.name}" -> code ${district.code}`
              );
              return district.code?.toString() || null;
            }

            // Tìm trong wards
            if (district.wards) {
              for (const ward of district.wards) {
                if (ward.codename === normalizedSlug) {
                  console.log(
                    `Found ward match by codename: "${ward.name}" -> code ${ward.code}`
                  );
                  return ward.code?.toString() || null;
                }
              }
            }
          }
        }
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

  // Tìm ward trong một district cụ thể
  async convertWardSlugToCodeInDistrict(
    wardSlug: string,
    districtCode: string,
    provinceCode: string
  ): Promise<string | null> {
    console.log(
      `Converting ward slug "${wardSlug}" in district ${districtCode}, province ${provinceCode}`
    );

    if (!isNaN(Number(wardSlug))) {
      console.log(`Ward slug is already a numeric code: ${wardSlug}`);
      return wardSlug;
    }

    try {
      const normalizedSlug = wardSlug.replace(/-/g, "_");
      console.log(`Normalized ward slug: "${normalizedSlug}"`);

      // Tìm province
      const province = await LocationModel.findOne({
        code: Number(provinceCode),
      });

      if (!province) {
        console.log(`Province not found for code: ${provinceCode}`);
        return null;
      }

      // Tìm district trong province
      const district = province.districts?.find(
        (d: any) => d.code === Number(districtCode)
      );

      if (!district) {
        console.log(
          `District not found for code: ${districtCode} in province ${provinceCode}`
        );
        return null;
      }

      // Tìm ward trong district
      const ward = district.wards?.find(
        (w: any) => w.codename === normalizedSlug
      );

      if (ward) {
        console.log(
          `Found ward match in correct district: "${ward.name}" -> code ${ward.code}`
        );
        return ward.code?.toString() || null;
      }

      console.log(
        `No ward found with codename "${normalizedSlug}" in district ${districtCode}`
      );
      return null;
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
        districts,
        wards,
        price,
        area,
        propertyId,
      } = req.query;

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // 1. Log điều kiện tìm kiếm
      console.log("Search criteria:", {
        type,
        category,
        city,
        districts,
        wards,
        price,
        area,
        propertyId,
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
      if (category) filter.category = category.toString();

      // Lưu lại cityCode để sử dụng cho ward lookup
      let cityCode: string | null = null;

      // Xử lý city có thể là slug hoặc code
      if (city) {
        cityCode = await this.convertLocationSlugToCode(city.toString());
        if (cityCode) {
          // Tìm cả theo code và tên
          const cityLocation = await LocationModel.findOne({
            code: Number(cityCode),
          });
          const cityName = cityLocation?.name;

          if (cityName) {
            filter["$or"] = [
              { "location.province": cityCode },
              { "location.province": cityName },
            ];
          } else {
            filter["location.province"] = cityCode;
          }
        } else {
          filter["location.province"] = city.toString();
        }
      }

      // Lưu lại districtCodes để sử dụng cho ward lookup
      let districtCodes: string[] = [];

      // Xử lý districts có thể là slug hoặc code
      if (districts) {
        console.log("Processing districts:", districts);
        const districtsList = districts.toString().split(",");
        if (districtsList.length > 0) {
          const codes = await Promise.all(
            districtsList.map(async (d) => {
              const code = await this.convertLocationSlugToCode(d);
              console.log(`District slug "${d}" -> code "${code}"`);
              return code;
            })
          );
          districtCodes = codes.filter(Boolean) as string[];

          if (districtCodes.length > 0) {
            filter["location.district"] = { $in: districtCodes };
            console.log(
              "Applied district filter:",
              filter["location.district"]
            );
          }
        }
      }

      // Xử lý wards có thể là slug hoặc code - QUAN TRỌNG: Tìm trong district cụ thể
      if (wards) {
        console.log("Processing wards:", wards);
        console.log("Wards type:", typeof wards);
        const wardsList = wards.toString().split(",");
        console.log("Wards after split:", wardsList);
        if (wardsList.length > 0) {
          const wardCodes: string[] = [];

          for (const w of wardsList) {
            // Nếu có cả cityCode và districtCodes, tìm ward trong district cụ thể
            if (cityCode && districtCodes.length > 0) {
              for (const districtCode of districtCodes) {
                const code = await this.convertWardSlugToCodeInDistrict(
                  w,
                  districtCode,
                  cityCode
                );
                if (code) {
                  wardCodes.push(code);
                  console.log(
                    `Ward slug "${w}" -> code "${code}" in district ${districtCode}`
                  );
                  break; // Tìm thấy rồi thì dừng lại
                }
              }
            } else {
              // Fallback về cách cũ nếu không có context
              const code = await this.convertLocationSlugToCode(w);
              if (code) {
                wardCodes.push(code);
                console.log(`Ward slug "${w}" -> code "${code}" (fallback)`);
              }
            }
          }

          if (wardCodes.length > 0) {
            filter["location.ward"] = { $in: wardCodes };
            console.log("Applied ward filter:", filter["location.ward"]);
          }
        }
      }

      // Handle price with proper type checking
      if (price && typeof price === "string") {
        const [minPrice, maxPrice] = price.split("-");
        filter.price = {};
        if (minPrice && !isNaN(parseFloat(minPrice))) {
          filter.price.$gte = parseFloat(minPrice);
        }
        if (maxPrice && !isNaN(parseFloat(maxPrice))) {
          filter.price.$lte = parseFloat(maxPrice);
        }
      }

      // Handle area with proper type checking
      if (area && typeof area === "string") {
        const [minArea, maxArea] = area.split("-");
        filter.area = {};
        if (minArea && !isNaN(parseFloat(minArea))) {
          filter.area.$gte = parseFloat(minArea);
        }
        if (maxArea && !isNaN(parseFloat(maxArea))) {
          filter.area.$lte = parseFloat(maxArea);
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
              city,
              districts,
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

          // Convert location codes to names if we have at least province and district
          if (loc && loc.province && loc.district) {
            // Check if province is a numeric code
            if (!isNaN(Number(loc.province))) {
              const province = await LocationModel.findOne({
                code: Number(loc.province),
              });

              if (province) {
                let districtName = loc.district;
                let wardName = loc.ward || "";

                // Convert district code to name if it's numeric
                if (!isNaN(Number(loc.district))) {
                  const district = province.districts.find(
                    (d: any) => d.code === Number(loc.district)
                  );
                  if (district) {
                    districtName = district.name || loc.district;

                    // Convert ward code to name if it exists and is numeric
                    if (loc.ward && !isNaN(Number(loc.ward))) {
                      const ward = district.wards.find(
                        (w: any) => w.code === Number(loc.ward)
                      );
                      if (ward) {
                        wardName = ward.name || loc.ward;
                      }
                    }
                  }
                }

                locationWithName = {
                  province: province.name || loc.province,
                  district: districtName,
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
            city,
            districts,
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

      // Nếu post đã expired, set lại status thành active
      if (post.status === "expired") {
        post.status = "active";
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

        // Nếu không đủ bài đăng từ cùng phường, tìm thêm từ cùng quận
        if (similarPosts.length < limit && currentPost.location?.district) {
          console.log(
            "🔍 Tìm thêm bài đăng cùng quận:",
            currentPost.location.district
          );

          // Build the query for district search
          const districtQuery = {
            _id: { $ne: postId },
            "location.district": currentPost.location.district,
            status: "active",
            project: null, // Chỉ tìm các bài đăng không thuộc dự án
            ...(currentPost.location.ward
              ? { "location.ward": { $ne: currentPost.location.ward } }
              : {}),
          };

          // Log the district search query
          console.log("District search query:", JSON.stringify(districtQuery));

          // Count posts matching this criteria before executing the full query
          const districtPostsCount = await Post.countDocuments(districtQuery);
          console.log(
            `Found ${districtPostsCount} total posts matching district criteria`
          );

          const districtPosts = await Post.find(districtQuery)
            .populate("category", "name slug")
            .populate("author", "name email")
            .populate("project", "name slug")
            .sort({ createdAt: -1 })
            .limit(limit - similarPosts.length);

          console.log(
            `Retrieved ${districtPosts.length} posts in same district`
          );
          similarPosts = [...similarPosts, ...districtPosts];

          if (searchCriteria === "ward" && districtPosts.length > 0) {
            searchCriteria = "ward_district";
          } else if (districtPosts.length > 0) {
            searchCriteria = "district";
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
        district: currentPost.location?.district,
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
}
