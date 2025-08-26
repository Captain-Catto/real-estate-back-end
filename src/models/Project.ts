import mongoose, { Document, Schema } from "mongoose";

export interface IDeveloper {
  name: string;
  logo: string;
  phone: string;
  email: string;
}

export interface ILocationInsight {
  name: string;
  distance: string;
}

export interface ILocationInsights {
  schools: ILocationInsight[];
  hospitals: ILocationInsight[];
  supermarkets: ILocationInsight[];
  parks: ILocationInsight[];
  restaurants: ILocationInsight[];
}

export interface IProjectFAQ {
  question: string;
  answer: string;
}

export interface IProjectSpecifications {
  [key: string]: string;
}

export interface IProjectContact {
  hotline: string;
  email: string;
}

export interface IProjectMap {
  lat: number;
  lng: number;
}

export interface IProjectLocation {
  provinceCode: string;
  wardCode: string;
}

export interface IProject extends Document {
  name: string;
  slug: string;
  address: string;
  location: IProjectLocation;
  latitude: number;
  longitude: number;
  developer: mongoose.Types.ObjectId; // Reference to Developer model
  category: mongoose.Types.ObjectId; // Reference to Category model for project type (single category)
  images: string[];
  videos?: string[];
  totalUnits: number;
  area: number; // Diện tích dự án (m²)
  numberOfTowers?: number;
  density?: string;
  status: "Đang cập nhật" | "Sắp mở bán" | "Đã bàn giao" | "Đang bán";
  priceRange: string; // Backward compatibility - auto-generated from minPrice/maxPrice
  minPrice?: number; // Giá thấp nhất (tỷ VND)
  maxPrice?: number; // Giá cao nhất (tỷ VND) 
  description: string;
  facilities: string[];
  specifications: IProjectSpecifications;
  locationInsights: ILocationInsights;
  faqs: IProjectFAQ[];
  contact: IProjectContact;
  map: IProjectMap;
  isFeatured: boolean; // Dự án nổi bật
  createdAt: Date;
  updatedAt: Date;
}

const LocationInsightSchema = new Schema(
  {
    name: { type: String, required: true },
    distance: { type: String, required: true },
  },
  { _id: false }
);

const LocationInsightsSchema = new Schema(
  {
    schools: [LocationInsightSchema],
    hospitals: [LocationInsightSchema],
    supermarkets: [LocationInsightSchema],
    parks: [LocationInsightSchema],
    restaurants: [LocationInsightSchema],
  },
  { _id: false }
);

const ProjectFAQSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const ProjectContactSchema = new Schema(
  {
    hotline: { type: String, required: true },
    email: { type: String, required: true },
  },
  { _id: false }
);

const ProjectMapSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      provinceCode: {
        type: String,
        required: true,
        trim: true,
      },
      wardCode: {
        type: String,
        trim: true,
      },
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    developer: {
      type: Schema.Types.ObjectId,
      ref: "Developer",
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    videos: [
      {
        type: String,
      },
    ],
    totalUnits: {
      type: Number,
      required: true,
      min: 0,
    },
    area: {
      type: Number,
      required: true,
      min: 0,
      max: 1000000, // Giới hạn tối đa 1 triệu m²
    },
    numberOfTowers: {
      type: Number,
      min: 0,
    },
    density: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Đang cập nhật", "Sắp mở bán", "Đã bàn giao", "Đang bán"],
      default: "Đang cập nhật",
    },
    priceRange: {
      type: String,
      required: true,
      trim: true,
    },
    minPrice: {
      type: Number,
      min: 0,
      max: 1000, // Giới hạn 1000 tỷ
      index: true, // Index để query nhanh
    },
    maxPrice: {
      type: Number,
      min: 0,
      max: 1000,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    facilities: [
      {
        type: String,
        trim: true,
      },
    ],
    specifications: {
      type: Schema.Types.Mixed,
      default: {},
    },
    locationInsights: {
      type: LocationInsightsSchema,
      required: true,
      default: {
        schools: [],
        hospitals: [],
        supermarkets: [],
        parks: [],
        restaurants: [],
      },
    },
    faqs: [ProjectFAQSchema],
    contact: {
      type: ProjectContactSchema,
      required: true,
    },
    map: {
      type: ProjectMapSchema,
      required: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true, // Index for better query performance
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
ProjectSchema.index({ slug: 1 }, { unique: true });
ProjectSchema.index({
  name: "text",
  description: "text",
  address: "text",
});
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ isFeatured: 1 });
ProjectSchema.index({ "developer.name": 1 });
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ "location.provinceCode": 1 });
ProjectSchema.index({ "location.wardCode": 1 });
ProjectSchema.index({
  "location.provinceCode": 1,
  "location.wardCode": 1,
});
ProjectSchema.index({
  isFeatured: -1,
  createdAt: -1,
});
// Indexes cho price filtering
ProjectSchema.index({ minPrice: 1, maxPrice: 1 });
ProjectSchema.index({ minPrice: 1 });
ProjectSchema.index({ maxPrice: 1 });

// Middleware để auto-generate priceRange từ minPrice/maxPrice
ProjectSchema.pre('save', function(next) {
  if (this.minPrice !== undefined && this.maxPrice !== undefined) {
    // Generate priceRange string từ numeric values
    if (this.minPrice === 0 && this.maxPrice === 1) {
      this.priceRange = "Dưới 1 tỷ";
    } else if (this.minPrice >= 50 && this.maxPrice >= 999) {
      this.priceRange = "Trên 50 tỷ";
    } else {
      this.priceRange = `${this.minPrice}-${this.maxPrice} tỷ`;
    }
  }
  next();
});

// Validation: minPrice phải <= maxPrice
ProjectSchema.pre('save', function(next) {
  if (this.minPrice !== undefined && this.maxPrice !== undefined) {
    if (this.minPrice > this.maxPrice) {
      const error = new Error('minPrice không thể lớn hơn maxPrice');
      return next(error);
    }
  }
  next();
});

export const Project = mongoose.model<IProject>("Project", ProjectSchema);
