// Types for Post API requests and responses

export interface PostLocation {
  province: string;
  ward: string;
  street?: string;
}

export interface UpdatePostRequest {
  type?: "ban" | "cho-thue";
  title?: string;
  description?: string;
  price?: number;
  location?: PostLocation;
  category?: string;
  images?: string[];
  area?: number;
  legalDocs?: string;
  furniture?: string;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  houseDirection?: string;
  balconyDirection?: string;
  roadWidth?: string;
  frontWidth?: string;
  packageId?: string;
  packageDuration?: number;
  package?: "free" | "basic" | "premium" | "vip";
  project?: string;
}

export interface CreatePostRequest {
  type: "ban" | "cho-thue";
  title: string;
  description: string;
  price: number;
  location: PostLocation;
  category: string;
  images: string[];
  area: number;
  legalDocs: string;
  furniture: string;
  bedrooms: number;
  bathrooms: number;
  floors?: number;
  houseDirection?: string;
  balconyDirection?: string;
  roadWidth?: string;
  frontWidth?: string;
  packageId?: string;
  packageDuration?: number;
  package?: "free" | "basic" | "premium" | "vip";
  project?: string;
}

export interface PostResponse {
  _id: string;
  type: "ban" | "cho-thue";
  title: string;
  description: string;
  price: number;
  location: PostLocation;
  category: string;
  author: string;
  images: string[];
  area: number;
  legalDocs: string;
  furniture: string;
  bedrooms: number;
  bathrooms: number;
  floors?: number;
  houseDirection?: string;
  balconyDirection?: string;
  roadWidth?: string;
  frontWidth?: string;
  packageId?: string;
  packageDuration?: number;
  status:
    | "pending"
    | "active"
    | "rejected"
    | "expired"
    | "inactive"
    | "deleted";
  priority?: "normal" | "premium" | "vip";
  package?: "free" | "basic" | "premium" | "vip";
  views: number;
  project?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectedReason?: string;
  expiredAt?: string;
  originalPackageDuration?: number;
}

export interface UpdatePostResponse {
  success: boolean;
  message: string;
  data?: {
    post: PostResponse;
  };
}

export interface CreatePostResponse {
  success: boolean;
  message: string;
  data?: {
    post: PostResponse;
  };
}
