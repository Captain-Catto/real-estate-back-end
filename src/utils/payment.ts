import crypto from "crypto";
import { format } from "date-fns";
import querystring from "querystring";

export interface VNPayParams {
  [key: string]: string;
}

export interface VnpayConfig {
  tmnCode: string;
  hashSecret: string;
  url: string;
  returnUrl: string;
  ipnUrl: string;
}

/**
 * Lấy cấu hình VNPAY từ biến môi trường
 */
export function getVnpayConfig(): VnpayConfig {
  return {
    tmnCode: process.env.VNP_TMN_CODE || "",
    hashSecret: process.env.VNP_HASH_SECRET || "",
    url:
      process.env.VNP_URL ||
      "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    returnUrl:
      process.env.VNP_RETURN_URL ||
      "http://localhost:3000/nguoi-dung/vi-tien/payment-result",
    ipnUrl:
      process.env.VNP_IPN_URL || "http://localhost:8080/api/payments/vnpay/ipn",
  };
}

/**
 * Tạo mã đơn hàng duy nhất
 */
export function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `ORDER_${timestamp}_${random}`.toUpperCase();
}

/**
 * Encode chuẩn cho VNPay (dùng encodeURIComponent, thay %20 bằng +)
 */
function vnpEncode(str: string): string {
  return encodeURIComponent(str).replace(/%20/g, "+");
}

/**
 * Sắp xếp object theo thứ tự key alphabet, loại bỏ value null/undefined/rỗng
 */
export function sortObject(obj: Record<string, any>): Record<string, any> {
  const sorted: Record<string, any> = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      if (obj[key] !== null && obj[key] !== undefined && obj[key] !== "") {
        sorted[key] = obj[key];
      }
    });
  return sorted;
}

/**
 * Tạo query string chuẩn cho hash (key=value nối &), encode key và value
 */
export function buildVNPayQueryString(params: Record<string, any>): string {
  const sorted = sortObject(params);
  return Object.keys(sorted)
    .map((key) => `${vnpEncode(key)}=${vnpEncode(sorted[key])}`)
    .join("&");
}

/**
 * Tạo secure hash cho VNPay (sha512)
 */
export function createVNPaySecureHash(
  params: VNPayParams,
  secretKey: string
): string {
  const data = buildVNPayQueryString(params);
  return crypto
    .createHmac("sha512", secretKey)
    .update(Buffer.from(data, "utf-8"))
    .digest("hex");
}

/**
 * Xác thực secure hash trả về từ VNPay
 */
export function verifyVNPaySecureHash(
  params: VNPayParams,
  receivedHash: string,
  secretKey: string
): boolean {
  const verifyParams = { ...params };
  delete verifyParams.vnp_SecureHash;
  delete verifyParams.vnp_SecureHashType;
  const calculatedHash = createVNPaySecureHash(verifyParams, secretKey);
  return calculatedHash === receivedHash;
}

/**
 * Tạo URL thanh toán VNPay
 */
export function buildVNPayUrl(params: VNPayParams): string {
  const { url } = getVnpayConfig();
  // Sử dụng buildVNPayQueryString để đảm bảo encode đúng chuẩn
  const query = buildVNPayQueryString(params);
  return `${url}?${query}`;
}

/**
 * Làm sạch thông tin order (loại ký tự đặc biệt không hợp lệ)
 */
export function sanitizeOrderInfo(orderInfo: string): string {
  return orderInfo.replace(/[#%&+]/g, "");
}

/**
 * Định dạng số tiền cho VNPay (nhân 100)
 */
export function formatVNPayAmount(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Parse số tiền từ VNPay (chia 100)
 */
export function parseVNPayAmount(amount: number): number {
  return Math.round(amount / 100);
}

/**
 * Lấy timestamp hiện tại theo định dạng VNPay
 */
export function getVNPayTimestamp(): string {
  return format(new Date(), "yyyyMMddHHmmss");
}

/**
 * Lấy IP client từ request (Express)
 */
export function getClientIp(req: any): string {
  let ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    "127.0.0.1";
  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") ip = "127.0.0.1";
  return ip;
}
