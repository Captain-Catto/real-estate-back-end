import crypto from "crypto";
import { format } from "date-fns";

// VNPAY Configuration
export const vnpayConfig = {
  tmnCode: process.env.VNP_TMN_CODE || "DEMO",
  hashSecret: process.env.VNP_HASH_SECRET || "VNPAYSECRET",
  url:
    process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  returnUrl:
    process.env.VNP_RETURN_URL || "http://localhost:3000/payment/vnpay-return",
  ipnUrl:
    process.env.VNP_IPN_URL || "http://localhost:3005/api/payments/vnpay/ipn",
};

export interface VNPayParams {
  [key: string]: string | number;
}

/**
 * Generate unique order ID
 */
export const generateOrderId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `ORDER_${timestamp}_${random}`.toUpperCase();
};

/**
 * Sort object properties alphabetically (required by VNPAY)
 */
export const sortObject = (obj: any): any => {
  const sorted: any = {};
  const keys = Object.keys(obj).sort();

  keys.forEach((key) => {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== "") {
      sorted[key] = obj[key];
    }
  });

  return sorted;
};

/**
 * Create VNPAY secure hash
 */
export const createVNPaySecureHash = (
  params: VNPayParams,
  secretKey: string
): string => {
  // Sort parameters
  const sortedParams = sortObject(params);

  // Create query string
  const querystring = Object.keys(sortedParams)
    .map((key) => `${key}=${encodeURIComponent(sortedParams[key])}`)
    .join("&");

  // Create hash
  const hmac = crypto.createHmac("sha512", secretKey);
  return hmac.update(Buffer.from(querystring, "utf-8")).digest("hex");
};

/**
 * Verify VNPAY secure hash
 */
export const verifyVNPaySecureHash = (
  params: any,
  receivedHash: string,
  secretKey: string
): boolean => {
  // Remove hash fields from params
  const verifyParams = { ...params };
  delete verifyParams.vnp_SecureHash;
  delete verifyParams.vnp_SecureHashType;

  // Create hash from remaining parameters
  const calculatedHash = createVNPaySecureHash(verifyParams, secretKey);

  return calculatedHash === receivedHash;
};

/**
 * Build VNPAY payment URL
 */
export const buildVNPayUrl = (params: VNPayParams): string => {
  const sortedParams = sortObject(params);
  const url = new URL(vnpayConfig.url);

  Object.keys(sortedParams).forEach((key) => {
    url.searchParams.append(key, sortedParams[key].toString());
  });

  return url.toString();
};

/**
 * Sanitize order info (remove special characters not allowed by VNPAY)
 */
export const sanitizeOrderInfo = (orderInfo: string): string => {
  return orderInfo.replace(/[#%&+]/g, "");
};

/**
 * Format amount for VNPAY (multiply by 100 as VNPAY uses xu unit)
 */
export const formatVNPayAmount = (amount: number): number => {
  return Math.round(amount * 100);
};

/**
 * Parse VNPAY amount (divide by 100 to get VND)
 */
export const parseVNPayAmount = (amount: number): number => {
  return Math.round(amount / 100);
};

/**
 * Get current timestamp in VNPAY format
 */
export const getVNPayTimestamp = (): string => {
  return format(new Date(), "yyyyMMddHHmmss");
};

/**
 * Get client IP address
 */
export const getClientIp = (req: any): string => {
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    "127.0.0.1"
  );
};
