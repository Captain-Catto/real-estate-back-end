import { Response } from "express";
import { Post } from "../models";
import { AuthenticatedRequest } from "../middleware";
import mongoose from "mongoose";
import { LocationModel } from "../models/Location";

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

      const post = new Post({
        type,
        title,
        description,
        content,
        price: price || null,
        location: parsedLocation || null,
        category,
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
        packageDuration,
        project:
          project && mongoose.Types.ObjectId.isValid(project) ? project : null,
      });

      await post.save();
      await post.populate("author", "username email avatar");

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

      const posts = await Post.find(filter)
        .populate("author", "username email avatar")
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

      const post = await Post.findById(postId).populate(
        "author",
        "username email avatar phoneNumber"
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Nếu location là code, tìm name trong LocationModel
      let locationWithName = post.location;

      const province = await LocationModel.findOne({
        code: Number(post.location.province),
      });
      const district = province?.districts.find(
        (d: any) => d.code === Number(post.location.district)
      );
      const ward = district?.wards.find(
        (w: any) => w.code === Number(post.location.ward)
      );

      locationWithName = {
        province: province?.name || post.location.province,
        district: district?.name || post.location.district,
        ward: ward?.name || post.location.ward,
        street: post.location.street || "",
      };

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
  // todo: không cho phép cập nhật category, type, status, author
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

      // Cập nhật các trường cần thiết
      const updates = req.body;

      // Handle package field specifically
      if (updates.package) {
        post.package = updates.package;
      }

      const allowedUpdateKeys = Object.keys(updates).filter(
        (key) =>
          key !== "category" &&
          key !== "type" &&
          key !== "status" &&
          key !== "package"
      );
      allowedUpdateKeys.forEach((key) => {
        // Use type assertion to avoid TS error
        (post as any)[key] = updates[key];
      });

      await post.save();
      res.json({
        success: true,
        message: "Post updated successfully",
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

      const allowedUpdateKeys = Object.keys(updates).filter(
        (key) =>
          key !== "category" &&
          key !== "type" &&
          key !== "status" &&
          key !== "package" &&
          key !== "author" &&
          key !== "createdAt" &&
          key !== "updatedAt"
      );
      allowedUpdateKeys.forEach((key) => {
        (post as any)[key] = updates[key];
      });

      // Đặt lại trạng thái về pending (chờ duyệt)
      post.status = "pending"; // pending
      post.rejectedAt = undefined;
      post.rejectedBy = undefined;
      post.rejectedReason = undefined;
      post.updatedAt = new Date();

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

      // Cập nhật trạng thái bài đăng
      post.status = status;
      await post.save();

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
    // Nếu đã là code số, trả về luôn
    if (!isNaN(Number(locationParam))) {
      return locationParam;
    }

    // Chuyển đổi từ slug sang code
    try {
      // Tìm trong tất cả các tỉnh/thành
      const allLocations = await LocationModel.find({}, "code name slug");

      // Tạo slug từ tên (đơn giản hóa)
      const convertToSlug = (name: string): string => {
        return name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[đĐ]/g, "d")
          .replace(/([^0-9a-z-\s])/g, "")
          .replace(/(\s+)/g, "_")
          .replace(/-+/g, "_");
      };

      // Tìm location bằng slug
      for (const location of allLocations) {
        const slug =
          location.get("slug") || convertToSlug(location.get("name") || "");
        if (slug === locationParam) {
          if (location.code !== undefined && location.code !== null) {
            return location.code.toString();
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Error converting location slug:", error);
      return null;
    }
  }

  // Lấy bài đăng theo api filters
  async searchPosts(req: AuthenticatedRequest, res: Response) {
    try {
      const { type, category, city, districts, price, area, propertyId } =
        req.query;

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // 1. Log điều kiện tìm kiếm
      console.log("Search criteria:", {
        type,
        category,
        city,
        districts,
        price,
        area,
        propertyId,
      });

      // 2. Xây dựng filter TRƯỚC khi truy vấn
      const filter: any = { status: "active" };

      if (type) filter.type = type.toString();
      if (category) filter.category = category.toString();

      // Xử lý city có thể là slug hoặc code
      if (city) {
        const cityCode = await this.convertLocationSlugToCode(city.toString());
        if (cityCode) {
          filter["location.province"] = cityCode;
        } else {
          filter["location.province"] = city.toString();
        }
      }

      // Xử lý districts có thể là slug hoặc code
      if (districts) {
        const districtsList = districts.toString().split(",");
        if (districtsList.length > 0) {
          const districtCodes = await Promise.all(
            districtsList.map((d) => this.convertLocationSlugToCode(d))
          );
          const validCodes = districtCodes.filter(Boolean);

          if (validCodes.length > 0) {
            filter["location.district"] = { $in: validCodes };
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

      // Nếu không tìm thấy kết quả, trả về mảng rỗng
      if (totalPosts === 0) {
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
            searchCriteria: { type, category, city, districts, price, area },
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
          searchCriteria: { type, category, city, districts, price, area },
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
}
