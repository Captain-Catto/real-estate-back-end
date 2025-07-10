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
  districtCode: string;
  wardCode?: string;
}

export interface IProject extends Document {
  name: string;
  slug: string;
  address: string;
  fullLocation?: string;
  location: IProjectLocation;
  latitude: number;
  longitude: number;
  developer: IDeveloper;
  images: string[];
  videos?: string[];
  totalUnits: number;
  area: string;
  numberOfTowers?: number;
  density?: string;
  status: "Đang cập nhật" | "Sắp mở bán" | "Đã bàn giao" | "Đang bán";
  priceRange: string;
  description: string;
  facilities: string[];
  specifications: IProjectSpecifications;
  locationInsights: ILocationInsights;
  faqs: IProjectFAQ[];
  contact: IProjectContact;
  map: IProjectMap;
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

const DeveloperSchema = new Schema(
  {
    name: { type: String, required: true },
    logo: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
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
    fullLocation: {
      type: String,
      required: false,
      trim: true,
    },
    location: {
      provinceCode: {
        type: String,
        required: true,
        trim: true,
      },
      districtCode: {
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
      type: DeveloperSchema,
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
      type: String,
      required: true,
      trim: true,
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
ProjectSchema.index({ "developer.name": 1 });
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ "location.provinceCode": 1 });
ProjectSchema.index({ "location.districtCode": 1 });
ProjectSchema.index({ "location.wardCode": 1 });
ProjectSchema.index({
  "location.provinceCode": 1,
  "location.districtCode": 1,
  "location.wardCode": 1,
});

export const Project = mongoose.model<IProject>("Project", ProjectSchema);
