import { Request, Response } from "express";
import { Project, IProject } from "../models/Project";
import { AuthenticatedRequest } from "../middleware";

export class ProjectController {
  // Get all projects with pagination and filters (public access)
  async getProjects(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter: any = {};

      // Filter by status
      if (req.query.status) {
        filter.status = req.query.status;
      }

      // Filter by developer
      if (req.query.developer) {
        filter["developer.name"] = {
          $regex: req.query.developer,
          $options: "i",
        };
      }

      // Filter by location - support both codes and slugs
      // Province filter
      if (req.query.provinceCode) {
        filter["location.provinceCode"] = req.query.provinceCode;
        console.log("📍 Filtering by provinceCode:", req.query.provinceCode);
      } else if (req.query.province) {
        // Handle province slug
        const provinceSlug = req.query.province as string;
        console.log("📍 Converting province slug to code:", provinceSlug);

        try {
          const { ProvinceModel } = await import("../models/Location");
          const province = await ProvinceModel.findOne({
            $or: [
              { slug: provinceSlug },
              { slug: `tinh-${provinceSlug}` },
              { slug: `thanh-pho-${provinceSlug}` },
            ],
          });

          if (province) {
            filter["location.provinceCode"] = province.code;
            console.log(
              `✅ Province slug "${provinceSlug}" -> code "${province.code}"`
            );
          } else {
            console.log(`❌ Province slug "${provinceSlug}" not found`);
          }
        } catch (error) {
          console.error("Error converting province slug:", error);
        }
      }

      // Ward filter
      if (req.query.wardCode) {
        filter["location.wardCode"] = req.query.wardCode;
        console.log("🏠 Filtering by wardCode:", req.query.wardCode);
      } else if (req.query.ward && filter["location.provinceCode"]) {
        // Handle ward slug - need province context
        const wardSlug = req.query.ward as string;
        const provinceCode = filter["location.provinceCode"];
        console.log(
          "🏠 Converting ward slug to code:",
          wardSlug,
          "in province:",
          provinceCode
        );

        try {
          const { WardModel } = await import("../models/Location");
          const ward = await WardModel.findOne({
            parent_code: provinceCode,
            $or: [{ slug: wardSlug }, { slug: wardSlug.replace(/-/g, "_") }],
          });

          if (ward) {
            filter["location.wardCode"] = ward.code;
            console.log(`✅ Ward slug "${wardSlug}" -> code "${ward.code}"`);
          } else {
            console.log(
              `❌ Ward slug "${wardSlug}" not found in province ${provinceCode}`
            );
          }
        } catch (error) {
          console.error("Error converting ward slug:", error);
        }
      }

      // Category filter - support both ID and slug
      if (req.query.categoryId) {
        filter.category = req.query.categoryId;
        console.log("🏷️ Filtering by categoryId:", req.query.categoryId);
      } else if (req.query.category) {
        // Handle category slug
        const categorySlug = req.query.category as string;
        console.log("🏷️ Converting category slug to ID:", categorySlug);

        try {
          const { Category } = await import("../models");
          const category = await Category.findOne({ slug: categorySlug });

          if (category) {
            filter.category = category._id;
            console.log(
              `✅ Category slug "${categorySlug}" -> ID "${category._id}"`
            );
          } else {
            console.log(`❌ Category slug "${categorySlug}" not found`);
          }
        } catch (error) {
          console.error("Error converting category slug:", error);
        }
      }

      // Price range filter
      if (req.query.price || req.query.priceRange) {
        const priceParam = req.query.price || req.query.priceRange;
        console.log("💰 Filtering by price:", priceParam);

        try {
          const { PriceRange } = await import("../models/Price");
          const priceRange = await PriceRange.findOne({
            $or: [{ slug: priceParam }, { id: priceParam }],
            type: "project",
          });

          if (priceRange) {
            console.log(`✅ Found priceRange config: "${priceRange.name}"`);

            // Parse numeric values từ priceRange name
            const priceMatch = priceRange.name.match(/(\d+)\s*[-–]\s*(\d+)/);
            let filterMinPrice, filterMaxPrice;

            if (priceMatch) {
              filterMinPrice = parseInt(priceMatch[1]);
              filterMaxPrice = parseInt(priceMatch[2]);
            } else {
              // Handle special cases
              const underMatch = priceRange.name.match(/Dưới\s*(\d+)/);
              const overMatch = priceRange.name.match(/Trên\s*(\d+)/);

              if (underMatch) {
                filterMinPrice = 0;
                filterMaxPrice = parseInt(underMatch[1]);
              } else if (overMatch) {
                filterMinPrice = parseInt(overMatch[1]);
                filterMaxPrice = 999;
              } else {
                // Fallback to old regex method for unrecognized formats
                filter.priceRange = {
                  $regex: priceRange.name.replace(/[-\s]/g, "\\s*[-–]\\s*"),
                  $options: "i",
                };
                console.log(
                  `⚠️ Using fallback regex for: "${priceRange.name}"`
                );
                // Skip numeric logic, fallback already applied
                return;
              }
            }

            // Simple numeric filtering approach
            // Tìm projects có numeric price overlap hoặc string match
            const numericPriceFilter = {
              $or: [
                // New format: numeric fields exist and overlap
                {
                  minPrice: { $exists: true, $ne: null, $lte: filterMaxPrice },
                  maxPrice: { $exists: true, $ne: null, $gte: filterMinPrice },
                },
                // Old format: no numeric fields, use string matching
                {
                  $and: [
                    {
                      $or: [
                        { minPrice: { $exists: false } },
                        { minPrice: null },
                      ],
                    },
                    {
                      priceRange: {
                        $regex: `${filterMinPrice}\\s*[-–]\\s*${filterMaxPrice}\\s*tỷ`,
                        $options: "i",
                      },
                    },
                  ],
                },
              ],
            };

            // Merge price filter with existing filters
            const existingFilterKeys = Object.keys(filter);
            if (existingFilterKeys.length > 0) {
              // If other filters exist, use $and to combine
              const existingFilters = { ...filter };
              // Clear existing filter properties
              existingFilterKeys.forEach((key) => delete filter[key]);
              // Set new combined filter
              filter.$and = [existingFilters, numericPriceFilter];
            } else {
              // No existing filters, apply price filter directly
              Object.assign(filter, numericPriceFilter);
            }

            console.log(
              `✅ Price filter "${priceParam}" (${filterMinPrice}-${filterMaxPrice}) -> applied numeric overlap logic`
            );
          } else {
            console.log(`❌ Price range "${priceParam}" not found`);
          }
        } catch (error) {
          console.error("Error converting price filter:", error);
        }
      }

      // Area range filter - now using numeric comparison since area is a number
      if (req.query.area || req.query.areaRange) {
        const areaParam = req.query.area || req.query.areaRange;
        console.log("📏 Filtering by area:", areaParam);

        try {
          const { Area } = await import("../models/Area");
          const areaRange = await Area.findOne({
            $or: [{ slug: areaParam }, { id: areaParam }],
            type: "project",
          });

          if (areaRange) {
            // Parse numeric values from area range name như "500 - 1.000 m²"
            // Handle both comma and dot as thousand separators
            const areaMatch = areaRange.name.match(
              /([\d.,]+)\s*[-–]\s*([\d.,]+)/
            );
            if (areaMatch) {
              // Remove thousand separators (both comma and dot)
              const filterMinArea = parseInt(areaMatch[1].replace(/[.,]/g, ""));
              const filterMaxArea = parseInt(areaMatch[2].replace(/[.,]/g, ""));

              // Use numeric comparison since area is now a number field
              filter.area = {
                $gte: filterMinArea,
                $lte: filterMaxArea,
              };

              console.log(
                `✅ Area filter "${areaParam}" (${filterMinArea}-${filterMaxArea}m²) -> using numeric range query`
              );
            } else {
              // Handle special cases like "Dưới X m²" or "Trên X m²"
              const underMatch = areaRange.name.match(/Dưới\s*([\d.,]+)/i);
              const overMatch = areaRange.name.match(/Trên\s*([\d.,]+)/i);

              if (underMatch) {
                const maxArea = parseInt(underMatch[1].replace(/[.,]/g, ""));
                filter.area = { $lt: maxArea };
                console.log(
                  `✅ Area filter "${areaParam}" -> area < ${maxArea}m²`
                );
              } else if (overMatch) {
                const minArea = parseInt(overMatch[1].replace(/[.,]/g, ""));
                filter.area = { $gt: minArea };
                console.log(
                  `✅ Area filter "${areaParam}" -> area > ${minArea}m²`
                );
              } else {
                console.log(
                  `⚠️ Could not parse area range: "${areaRange.name}"`
                );
              }
            }
          } else {
            console.log(`❌ Area range "${areaParam}" not found`);
          }
        } catch (error) {
          console.error("Error converting area filter:", error);
        }
      }

      // Filter by location text (fallback if no location codes provided)
      if (
        req.query.location &&
        !req.query.provinceCode &&
        !req.query.wardCode
      ) {
        filter.fullLocation = { $regex: req.query.location, $options: "i" };
      }

      // Search by name, description, address, or location (diacritic-insensitive and smart location matching)
      if (req.query.search) {
        // Normalize search text (remove diacritics)
        const normalizeForSearch = (text: string): string => {
          return text
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .toLowerCase()
            .trim();
        };

        const originalSearch = req.query.search as string;
        const normalizedSearch = normalizeForSearch(originalSearch);

        console.log(
          "🔍 Search query:",
          originalSearch,
          "-> normalized:",
          normalizedSearch
        );

        // Create search conditions using MongoDB aggregation with text normalization
        const searchConditions: any[] = [];

        // Tạo regex pattern cho cả text có dấu và không dấu
        const createSearchPattern = (term: string): string => {
          // Tạo pattern cho phép match cả có dấu và không dấu
          return term
            .replace(/a/g, "[aàáạảãâầấậẩẫăằắặẳẵ]")
            .replace(/e/g, "[eèéẹẻẽêềếệểễ]")
            .replace(/i/g, "[iìíịỉĩ]")
            .replace(/o/g, "[oòóọỏõôồốộổỗơờớợởỡ]")
            .replace(/u/g, "[uùúụủũưừứựửữ]")
            .replace(/y/g, "[yỳýỵỷỹ]")
            .replace(/d/g, "[dđ]")
            .replace(/A/g, "[AÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]")
            .replace(/E/g, "[EÈÉẸẺẼÊỀẾỆỂỄ]")
            .replace(/I/g, "[IÌÍỊỈĨ]")
            .replace(/O/g, "[OÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]")
            .replace(/U/g, "[UÙÚỤỦŨƯỪỨỰỬỮ]")
            .replace(/Y/g, "[YỲÝỴỶỸ]")
            .replace(/D/g, "[DĐ]");
        };

        const flexiblePattern = createSearchPattern(normalizedSearch);

        // Search trong các field với pattern linh hoạt
        searchConditions.push(
          // Search trong tên dự án
          { name: { $regex: flexiblePattern, $options: "i" } },
          // Search trong description
          { description: { $regex: flexiblePattern, $options: "i" } },
          // Search trong address
          { address: { $regex: flexiblePattern, $options: "i" } },
          // Search trong fullLocation
          { fullLocation: { $regex: flexiblePattern, $options: "i" } }
        );

        // Smart location matching - if search term looks like a location name, try to match province/ward
        try {
          const { ProvinceModel, WardModel } = await import(
            "../models/Location"
          );

          // Check if search matches any province name (with or without diacritics)
          const matchingProvinces = await ProvinceModel.find({
            $or: [
              { name: { $regex: originalSearch, $options: "i" } },
              { name: { $regex: normalizedSearch, $options: "i" } },
              {
                slug: {
                  $regex: normalizedSearch.replace(/\s+/g, "-"),
                  $options: "i",
                },
              },
            ],
          });

          if (matchingProvinces.length > 0) {
            console.log(
              "🏙️ Found matching provinces:",
              matchingProvinces.map((p) => p.name)
            );
            // Add province code conditions
            matchingProvinces.forEach((province) => {
              searchConditions.push({ "location.provinceCode": province.code });
            });
          }

          // Check if search matches any ward name (with or without diacritics)
          const matchingWards = await WardModel.find({
            $or: [
              { name: { $regex: originalSearch, $options: "i" } },
              { name: { $regex: normalizedSearch, $options: "i" } },
              {
                slug: {
                  $regex: normalizedSearch.replace(/\s+/g, "-"),
                  $options: "i",
                },
              },
            ],
          }).limit(20); // Limit to prevent too many results

          if (matchingWards.length > 0) {
            console.log(
              "🏘️ Found matching wards:",
              matchingWards.map((w) => w.name)
            );
            // Add ward code conditions
            matchingWards.forEach((ward) => {
              searchConditions.push({ "location.wardCode": ward.code });
            });
          }
        } catch (error) {
          console.error("Error in smart location matching:", error);
        }

        filter.$or = searchConditions;
        console.log("🔍 Total search conditions:", searchConditions.length);
      }

      // Build sort object
      const sortBy = (req.query.sortBy as string) || "newest";
      let sortObject: any = {};

      switch (sortBy) {
        case "newest":
          sortObject = { createdAt: -1 };
          break;
        case "updated":
          sortObject = { updatedAt: -1 };
          break;
        case "price-high":
          // Sort by priceRange string (for now, until we have numeric price)
          sortObject = { priceRange: -1, createdAt: -1 };
          break;
        case "price-low":
          sortObject = { priceRange: 1, createdAt: -1 };
          break;
        case "area-large":
          // Sort by area string (for now, until we have numeric area)
          sortObject = { area: -1, createdAt: -1 };
          break;
        case "area-small":
          sortObject = { area: 1, createdAt: -1 };
          break;
        case "name-asc":
          sortObject = { name: 1 };
          break;
        case "name-desc":
          sortObject = { name: -1 };
          break;
        default:
          sortObject = { createdAt: -1 };
      }

      console.log("🔀 Sort applied:", sortBy, "->", JSON.stringify(sortObject));

      console.log("🔍 Final filter applied:", JSON.stringify(filter, null, 2));

      // Debug: Show all unique priceRange values in database
      const allPriceRanges = await Project.distinct("priceRange");
      console.log(
        "🏷️ All priceRange values in DB:",
        allPriceRanges.filter((p) => p)
      );

      // Debug: Show all unique area values in database
      const allAreas = await Project.distinct("area");
      console.log(
        "📐 All area values in DB:",
        allAreas.filter((a) => a)
      );

      // Count total projects
      const totalProjects = await Project.countDocuments(filter);
      console.log("📊 Total projects found:", totalProjects);

      // Get projects with pagination
      const projects = await Project.find(filter)
        .select("-__v")
        .populate("developer", "name logo contact")
        .sort(sortObject)
        .skip(skip)
        .limit(limit);

      console.log("📋 Projects returned:", projects.length);
      if (projects.length > 0) {
        console.log("📋 Sample project priceRange:", projects[0].priceRange);
      }

      res.json({
        success: true,
        data: {
          projects,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalProjects / limit),
            totalItems: totalProjects,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy danh sách dự án",
      });
    }
  }

  // Get featured projects (public access)
  async getFeaturedProjects(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 8;

      console.log("🌟 Getting featured projects with limit:", limit);

      // Get featured projects, sorted by creation date (newest first)
      const projects = await Project.find({ isFeatured: true })
        .select("-__v")
        .populate("developer", "name logo contact")
        .sort({ createdAt: -1 })
        .limit(limit);

      console.log("🌟 Found", projects.length, "featured projects");

      res.json({
        success: true,
        data: {
          projects,
          total: projects.length,
        },
      });
    } catch (error) {
      console.error("Error fetching featured projects:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy danh sách dự án nổi bật",
      });
    }
  }

  // Get project by ID (public access)
  async getProjectById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const project = await Project.findById(id)
        .select("-__v")
        .populate("developer", "name logo contact");

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy dự án",
        });
      }

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      console.error("Error fetching project by ID:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy thông tin dự án",
      });
    }
  }

  // Get project by slug (public access)
  async getProjectBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const project = await Project.findOne({ slug })
        .select("-__v")
        .populate("developer", "name logo contact");

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy dự án",
        });
      }

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      console.error("Error fetching project by slug:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy thông tin dự án",
      });
    }
  }

  // ===== ADMIN METHODS =====

  // Get all projects for admin (with more detailed info)
  async getAdminProjects(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter: any = {};

      // Filter by status
      if (req.query.status) {
        filter.status = req.query.status;
      }

      // Search by name, description, address, or location (diacritic-insensitive)
      if (req.query.search) {
        // Normalize search text (remove diacritics)
        const normalizeForSearch = (text: string): string => {
          return text
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .toLowerCase()
            .trim();
        };

        const normalizedSearch = normalizeForSearch(req.query.search as string);

        filter.$or = [
          { name: { $regex: normalizedSearch, $options: "i" } },
          { description: { $regex: normalizedSearch, $options: "i" } },
          { address: { $regex: normalizedSearch, $options: "i" } },
          { fullLocation: { $regex: normalizedSearch, $options: "i" } },
        ];
      }

      // Count total projects
      const totalProjects = await Project.countDocuments(filter);

      // Get projects with pagination
      const projects = await Project.find(filter)
        .select(
          "_id name slug address location developer status totalUnits area priceRange isFeatured createdAt updatedAt"
        )
        .populate("developer", "name logo")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        data: {
          projects,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalProjects / limit),
            totalItems: totalProjects,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching admin projects:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy danh sách dự án",
      });
    }
  }

  // Create new project (admin only)
  async createProject(req: AuthenticatedRequest, res: Response) {
    try {
      const projectData = req.body;

      // Validate required location codes
      if (!projectData.location || !projectData.location.provinceCode) {
        return res.status(400).json({
          success: false,
          message: "Mã tỉnh/thành phố là bắt buộc",
        });
      }

      // Check if slug already exists
      const existingProject = await Project.findOne({ slug: projectData.slug });
      if (existingProject) {
        return res.status(400).json({
          success: false,
          message: "Slug đã tồn tại, vui lòng chọn slug khác",
        });
      }

      // Create new project
      const project = new Project(projectData);
      await project.save();

      res.status(201).json({
        success: true,
        message: "Dự án đã được tạo thành công",
        data: project,
      });
    } catch (error: any) {
      console.error("Error creating project:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi tạo dự án",
      });
    }
  }

  // Update project (admin only)
  async updateProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if project exists
      const existingProject = await Project.findById(id);
      if (!existingProject) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy dự án",
        });
      }

      // Validate location codes if being updated
      if (updateData.location) {
        if (!updateData.location.provinceCode) {
          return res.status(400).json({
            success: false,
            message: "Mã tỉnh/thành phố là bắt buộc",
          });
        }
      }

      // If slug is being updated, check if new slug already exists
      if (updateData.slug && updateData.slug !== existingProject.slug) {
        const slugExists = await Project.findOne({
          slug: updateData.slug,
          _id: { $ne: id },
        });
        if (slugExists) {
          return res.status(400).json({
            success: false,
            message: "Slug đã tồn tại, vui lòng chọn slug khác",
          });
        }
      }

      // Update project
      const updatedProject = await Project.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).select("-__v");

      res.json({
        success: true,
        message: "Dự án đã được cập nhật thành công",
        data: updatedProject,
      });
    } catch (error: any) {
      console.error("Error updating project:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi cập nhật dự án",
      });
    }
  }

  // Delete project (admin only)
  async deleteProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const project = await Project.findByIdAndDelete(id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy dự án",
        });
      }

      res.json({
        success: true,
        message: "Dự án đã được xóa thành công",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi xóa dự án",
      });
    }
  }

  // Get project statistics (admin only)
  async getProjectStats(req: AuthenticatedRequest, res: Response) {
    try {
      const totalProjects = await Project.countDocuments();
      const projectsByStatus = await Project.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const recentProjects = await Project.find()
        .select("name status createdAt")
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        success: true,
        data: {
          totalProjects,
          projectsByStatus,
          recentProjects,
        },
      });
    } catch (error) {
      console.error("Error fetching project stats:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy thống kê dự án",
      });
    }
  }

  // Reorder project images (admin only)
  async reorderProjectImages(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { images } = req.body;

      // Validate that images array is provided and not empty
      if (!Array.isArray(images)) {
        return res.status(400).json({
          success: false,
          message: "Images array is required",
        });
      }

      // Validate that images array has at most 20 items
      if (images.length > 20) {
        return res.status(400).json({
          success: false,
          message: "Cannot have more than 20 images",
        });
      }

      // Check if project exists
      const existingProject = await Project.findById(id);
      if (!existingProject) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      // Validate that all provided URLs exist in the current project images
      const currentImages = existingProject.images || [];
      const invalidImages = images.filter(
        (url: string) => !currentImages.includes(url)
      );

      if (invalidImages.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Some images are not valid for this project",
          invalidImages,
        });
      }

      // Update project with new image order
      const updatedProject = await Project.findByIdAndUpdate(
        id,
        { images },
        { new: true, runValidators: true }
      ).select("-__v");

      console.log(
        `✅ Reordered images for project ${id}: ${images.length} images`
      );

      res.json({
        success: true,
        message: "Images reordered successfully",
        data: {
          images: updatedProject?.images || [],
        },
      });
    } catch (error: any) {
      console.error("Error reordering project images:", error);
      res.status(500).json({
        success: false,
        message: "Error reordering images",
      });
    }
  }

  // Get projects for dropdown selection (simplified response)
  async getProjectsForSelection(req: Request, res: Response) {
    try {
      console.log("🔍 Getting projects for selection with query:", req.query);

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter: any = {};

      // Filter by status - only apply if status is not 'all'
      if (req.query.status && req.query.status !== "all") {
        filter.status = req.query.status;
        console.log("🏷️ Filtering by status:", req.query.status);
      } else if (!req.query.status) {
        // Default behavior - only show active projects if no status specified
        filter.$or = [
          { status: "active" },
          { status: "Đang bán" },
          { status: "Sắp mở bán" },
        ];
        console.log("🏷️ Using default status filter (active projects only)");
      } else {
        console.log("🏷️ Getting ALL projects regardless of status");
      }

      // Filter by location codes if provided
      if (req.query.provinceCode) {
        filter["location.provinceCode"] = req.query.provinceCode;
        console.log("📍 Filtering by province:", req.query.provinceCode);
      }

      // Filter by ward code if provided
      if (req.query.wardCode) {
        filter["location.wardCode"] = req.query.wardCode;
        console.log("🏠 Filtering by ward:", req.query.wardCode);
      }

      // Filter by category if provided
      if (req.query.categoryId) {
        filter.category = req.query.categoryId;
        console.log("🏷️ Filtering by category:", req.query.categoryId);
      }

      // Search by name or address if provided
      if (req.query.search) {
        const searchTerm = req.query.search as string;
        const searchFilter = {
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
            { address: { $regex: searchTerm, $options: "i" } },
          ],
        };

        // If we already have filters, combine them with $and
        if (Object.keys(filter).length > 0) {
          filter.$and = [
            // Preserve existing filters
            { ...filter },
            // Add search filter
            searchFilter,
          ];

          // Clean up the original filter properties that are now in $and
          Object.keys(filter).forEach((key) => {
            if (key !== "$and") {
              delete filter[key];
            }
          });
        } else {
          // If no existing filters, just add the search filter
          Object.assign(filter, searchFilter);
        }

        console.log("🔍 Searching for:", searchTerm);
      }

      console.log("🔍 Final filter:", JSON.stringify(filter, null, 2));

      // Count total projects matching filter
      const totalProjects = await Project.countDocuments(filter);

      // Get projects with essential fields and pagination
      const projects = await Project.find(filter)
        .select("_id name address location developer.name status category")
        .populate("category", "_id name isProject")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      console.log(
        `✅ Found ${projects.length} projects (page ${page}/${Math.ceil(
          totalProjects / limit
        )})`
      );

      // Transform projects to include fullLocation
      const transformedProjects = projects.map((project) => ({
        _id: project._id,
        name: project.name,
        address: project.address,
        fullLocation: project.address || "Địa chỉ chưa cập nhật",
        location: project.location,
        category: project.category,
      }));

      // Return with pagination info if requested, otherwise return array for backward compatibility
      if (req.query.includePagination === "true") {
        res.json({
          success: true,
          data: {
            projects: transformedProjects,
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(totalProjects / limit),
              totalItems: totalProjects,
              itemsPerPage: limit,
              hasMore: page < Math.ceil(totalProjects / limit),
            },
          },
        });
      } else {
        // Backward compatibility - return array directly
        res.json(transformedProjects);
      }
    } catch (error) {
      console.error("❌ Error getting projects for selection:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách dự án",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
