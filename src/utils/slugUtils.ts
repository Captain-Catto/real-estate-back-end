// Shared slug utilities for the real estate platform
import { ProvinceModel, WardModel } from "../models/Location";

export interface SlugData {
  type: "mua-ban" | "cho-thue";
  province: string;
  ward: string;
  postId?: string;
  title?: string;
}

/**
 * Create a URL-safe slug from Vietnamese text
 */
export function createSlug(text: string): string {
  if (!text) return "";

  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Convert Vietnamese text to slug with underscores (for database queries)
 */
export function createUnderscoreSlug(text: string): string {
  return createSlug(text).replace(/-/g, "_");
}

/**
 * Generate a complete post slug: /type/province/ward/postid-title
 */
export function generatePostSlug(data: SlugData): string {
  const { type, province, ward, postId, title } = data;

  let slug = `/${type}/${createSlug(province)}/${createSlug(ward)}`;

  if (postId && title) {
    slug += `/${postId}-${createSlug(title)}`;
  }

  return slug;
}

/**
 * Generate a listing page slug: /type/province/ward
 */
export function generateListingSlug(
  data: Omit<SlugData, "postId" | "title">
): string {
  const { type, province, ward } = data;
  return `/${type}/${createSlug(province)}/${createSlug(ward)}`;
}

/**
 * Parse a slug path into components
 */
export function parseSlug(path: string): {
  type?: "mua-ban" | "cho-thue";
  province?: string;
  ward?: string;
  postId?: string;
  title?: string;
  isPostDetail: boolean;
  isListing: boolean;
} {
  // Remove leading slash and split
  const segments = path.replace(/^\//, "").split("/");

  if (segments.length < 1) {
    return { isPostDetail: false, isListing: false };
  }

  const type = segments[0] as "mua-ban" | "cho-thue";
  const province = segments[1];
  const ward = segments[2];
  const postSegment = segments[3];

  // Check if it's a post detail (has postid-title format)
  if (postSegment && postSegment.includes("-")) {
    const firstDashIndex = postSegment.indexOf("-");
    const postId = postSegment.substring(0, firstDashIndex);
    const title = postSegment.substring(firstDashIndex + 1);

    // Validate postId is numeric
    if (/^\d+$/.test(postId)) {
      return {
        type,
        province,
        ward,
        postId,
        title,
        isPostDetail: true,
        isListing: false,
      };
    }
  }

  // If we have type, province, ward but no valid post detail, it's a listing
  if (type && province && ward) {
    return {
      type,
      province,
      ward,
      isPostDetail: false,
      isListing: true,
    };
  }

  // If we only have type and province, it's also a listing
  if (type && province) {
    return {
      type,
      province,
      isPostDetail: false,
      isListing: true,
    };
  }

  // Just type
  if (type) {
    return {
      type,
      isPostDetail: false,
      isListing: true,
    };
  }

  return { isPostDetail: false, isListing: false };
}

/**
 * Convert location code to slug
 */
export async function convertLocationCodeToSlug(
  code: string | number,
  type: "province" | "ward"
): Promise<string> {
  try {
    if (type === "province") {
      const province = await ProvinceModel.findOne({ code: Number(code) });
      return province && province.name
        ? createSlug(province.name)
        : code.toString();
    } else {
      const ward = await WardModel.findOne({ code: Number(code) });
      return ward && ward.name ? createSlug(ward.name) : code.toString();
    }
  } catch (error) {
    console.error(`Error converting ${type} code to slug:`, error);
    return code.toString();
  }
}

/**
 * Convert location slug to code
 */
export async function convertLocationSlugToCode(
  slug: string,
  type: "province" | "ward",
  provinceCode?: string
): Promise<string | null> {
  try {
    // If it's already a numeric code, return as string
    if (!isNaN(Number(slug))) {
      return slug;
    }

    const normalizedSlug = createUnderscoreSlug(slug);

    if (type === "province") {
      const province = await ProvinceModel.findOne({ slug: normalizedSlug });
      return province ? province.code?.toString() || null : null;
    } else {
      // For ward, we need to search within a specific province
      const queryConditions: any = { slug: normalizedSlug };
      if (provinceCode) {
        queryConditions.parent_code = provinceCode;
      }

      const ward = await WardModel.findOne(queryConditions);
      return ward ? ward.code?.toString() || null : null;
    }
  } catch (error) {
    console.error(`Error converting ${type} slug to code:`, error);
    return null;
  }
}

/**
 * Validate transaction type
 */
export function isValidTransactionType(
  type: string
): type is "mua-ban" | "cho-thue" {
  return type === "mua-ban" || type === "cho-thue";
}

/**
 * Convert transaction type to backend format
 */
export function convertTransactionType(
  type: "mua-ban" | "cho-thue"
): "ban" | "cho-thue" {
  return type === "mua-ban" ? "ban" : "cho-thue";
}

/**
 * Convert backend transaction type to URL format
 */
export function convertBackendTransactionType(
  type: "ban" | "cho-thue"
): "mua-ban" | "cho-thue" {
  return type === "ban" ? "mua-ban" : "cho-thue";
}

/**
 * Build search URL with filters
 */
export function buildSearchUrl(
  baseSlug: string,
  filters: {
    category?: string;
    price?: string;
    area?: string;
    [key: string]: string | undefined;
  }
): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "") {
      params.append(key, value);
    }
  });

  const queryString = params.toString();
  return queryString ? `${baseSlug}?${queryString}` : baseSlug;
}

/**
 * Normalize Vietnamese text for search (remove accents and convert to lowercase)
 */
export function normalizeVietnameseForSearch(text: string): string {
  if (!text) return "";
  
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .trim();
}

/**
 * Extract search filters from URL search params
 */
export function extractFiltersFromParams(searchParams: URLSearchParams): {
  search?: string;
  category?: string;
  price?: string;
  area?: string;
  sortBy?: string;
  [key: string]: string | undefined;
} {
  const filters: { [key: string]: string | undefined } = {};

  // Extract common search filters
  const filterKeys = ["search", "category", "price", "area", "sortBy"];

  filterKeys.forEach((key) => {
    const value = searchParams.get(key);
    if (value) {
      filters[key] = value;
    }
  });

  return filters;
}
