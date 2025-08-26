import { Request, Response } from "express";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

export class AiController {
  /**
   * Tạo tiêu đề cho bài đăng BĐS bằng AI
   */
  async generateTitle(req: Request, res: Response) {
    try {
      const propertyData = req.body;

      // LOG: Ghi lại toàn bộ data nhận vào
      console.log("=== AI GENERATE TITLE REQUEST ===");
      console.log("Timestamp:", new Date().toISOString());
      console.log("User ID:", (req as any).user?.userId || "Unknown");
      console.log("Raw Request Body:", JSON.stringify(propertyData, null, 2));
      console.log("Request Headers:", {
        "content-type": req.headers["content-type"],
        "user-agent": req.headers["user-agent"],
      });

      if (
        !propertyData.type ||
        !propertyData.category ||
        !propertyData.location
      ) {
        console.log("❌ VALIDATION FAILED - Missing required fields:");
        console.log("- type:", !!propertyData.type);
        console.log("- category:", !!propertyData.category);
        console.log("- location:", !!propertyData.location);

        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin bất động sản",
        });
      }

      // LOG: Ghi lại data đã validated
      console.log("✅ VALIDATION PASSED - Processed data:");
      console.log("- Type:", propertyData.type);
      console.log("- Category:", propertyData.category);
      console.log("- Location:", JSON.stringify(propertyData.location));
      console.log("- Area:", propertyData.area);
      console.log("- Price:", propertyData.price);
      console.log("- Currency:", propertyData.currency);
      console.log("- Bedrooms:", propertyData.bedrooms);
      console.log("- Bathrooms:", propertyData.bathrooms);
      console.log("- House Direction:", propertyData.houseDirection);

      // Tạo prompt cho Groq
      const prompt = this.createTitlePrompt(propertyData);

      // LOG: Ghi lại prompt được tạo
      console.log("📝 GENERATED PROMPT:");
      console.log(prompt);
      console.log("Prompt length:", prompt.length);

      // Gọi API Groq để tạo tiêu đề
      console.log("🤖 CALLING GROQ AI...");
      const startTime = Date.now();
      const title = await this.callGroqAI(prompt);
      const endTime = Date.now();

      // LOG: Ghi lại kết quả
      console.log("✨ AI RESPONSE:");
      console.log("Generated title:", title);
      console.log("Title length:", title.length);
      console.log("Processing time:", endTime - startTime, "ms");
      console.log("=== END AI GENERATE TITLE ===\n");

      res.json({
        success: true,
        title,
      });
    } catch (error) {
      console.error("❌ ERROR in generateTitle:");
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      } else {
        console.error("Error value:", error);
      }
      console.error("Request body:", JSON.stringify(req.body, null, 2));
      console.log("=== END AI GENERATE TITLE (ERROR) ===\n");

      res.status(500).json({
        success: false,
        message: "Đã xảy ra lỗi khi tạo tiêu đề",
      });
    }
  }

  /**
   * Tạo mô tả cho bài đăng BĐS bằng AI
   */
  async generateDescription(req: Request, res: Response) {
    try {
      const propertyData = req.body;

      // LOG: Ghi lại toàn bộ data nhận vào
      console.log("=== AI GENERATE DESCRIPTION REQUEST ===");
      console.log("Timestamp:", new Date().toISOString());
      console.log("User ID:", (req as any).user?.userId || "Unknown");
      console.log("Raw Request Body:", JSON.stringify(propertyData, null, 2));
      console.log("Request Headers:", {
        "content-type": req.headers["content-type"],
        "user-agent": req.headers["user-agent"],
      });

      if (
        !propertyData.type ||
        !propertyData.category ||
        !propertyData.location
      ) {
        console.log("❌ VALIDATION FAILED - Missing required fields:");
        console.log("- type:", !!propertyData.type);
        console.log("- category:", !!propertyData.category);
        console.log("- location:", !!propertyData.location);

        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin bất động sản",
        });
      }

      // LOG: Ghi lại data đã validated
      console.log("✅ VALIDATION PASSED - Processed data:");
      console.log("- Type:", propertyData.type);
      console.log("- Category:", propertyData.category);
      console.log("- Location:", JSON.stringify(propertyData.location));
      console.log("- Area:", propertyData.area);
      console.log("- Price:", propertyData.price);
      console.log("- Currency:", propertyData.currency);
      console.log("- Bedrooms:", propertyData.bedrooms);
      console.log("- Bathrooms:", propertyData.bathrooms);
      console.log("- Furniture:", propertyData.furniture);
      console.log("- Legal Docs:", propertyData.legalDocs);
      console.log("- House Direction:", propertyData.houseDirection);
      console.log("- Balcony Direction:", propertyData.balconyDirection);
      console.log("- Road Width:", propertyData.roadWidth);
      console.log("- Front Width:", propertyData.frontWidth);

      // Tạo prompt cho Groq
      const prompt = this.createDescriptionPrompt(propertyData);

      // LOG: Ghi lại prompt được tạo
      console.log("📝 GENERATED PROMPT:");
      console.log(prompt);
      console.log("Prompt length:", prompt.length);

      // Gọi API Groq để tạo mô tả
      console.log("🤖 CALLING GROQ AI...");
      const startTime = Date.now();
      const description = await this.callGroqAI(prompt);
      const endTime = Date.now();

      // LOG: Ghi lại kết quả
      console.log("✨ AI RESPONSE:");
      console.log("Generated description:", description);
      console.log("Description length:", description.length);
      console.log("Processing time:", endTime - startTime, "ms");
      console.log("=== END AI GENERATE DESCRIPTION ===\n");

      res.json({
        success: true,
        description,
      });
    } catch (error) {
      console.error("❌ ERROR in generateDescription:");
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      } else {
        console.error("Error value:", error);
      }
      console.error("Request body:", JSON.stringify(req.body, null, 2));
      console.log("=== END AI GENERATE DESCRIPTION (ERROR) ===\n");

      res.status(500).json({
        success: false,
        message: "Đã xảy ra lỗi khi tạo mô tả",
      });
    }
  }

  /**
   * Tạo prompt cho tiêu đề (giữ nguyên)
   */
  private createTitlePrompt(propertyData: any): string {
    const location = propertyData.location;
    const fullAddress = [
      location.street,
      location.ward,
      location.district,
      location.province,
    ]
      .filter(Boolean)
      .join(", ");

    return `Tạo một tiêu đề ngắn gọn, hấp dẫn cho bài đăng bất động sản với các thông tin sau:
- Loại giao dịch: ${propertyData.type}
- Loại bất động sản: ${propertyData.category}
- Địa chỉ: ${fullAddress}
- Diện tích: ${propertyData.area} m²
- Giá: ${propertyData.price} ${propertyData.currency}
- Số phòng ngủ: ${propertyData.bedrooms || "Không có thông tin"}
- Số phòng tắm: ${propertyData.bathrooms || "Không có thông tin"}
- Hướng nhà: ${propertyData.houseDirection || "Không có thông tin"}

Yêu cầu:
- Tiêu đề ngắn gọn, ít nhất 100 ký tự và không quá 150 ký tự
- Đặt thông tin quan trọng lên đầu (loại giao dịch, loại BĐS, diện tích, địa điểm)
- Sử dụng các từ ngữ hấp dẫn nhưng không phóng đại
- Tiêu đề phải bằng tiếng Việt có dấu
- Không sử dụng dấu chấm câu ở cuối tiêu đề

Chỉ trả về tiêu đề, không có giải thích.`;
  }

  /**
   * Tạo prompt cho mô tả
   */
  private createDescriptionPrompt(propertyData: any): string {
    const location = propertyData.location;
    const fullAddress = [
      location.street,
      location.ward,
      location.district,
      location.province,
    ]
      .filter(Boolean)
      .join(", ");

    return `Tạo một mô tả chi tiết, hấp dẫn cho bài đăng bất động sản với các thông tin sau:
- Loại giao dịch: ${propertyData.type}
- Loại bất động sản: ${propertyData.category}
- Địa chỉ: ${fullAddress}
- Diện tích: ${propertyData.area} m²
- Giá: ${propertyData.price} ${propertyData.currency}
- Số phòng ngủ: ${propertyData.bedrooms || "Không có thông tin"}
- Số phòng tắm: ${propertyData.bathrooms || "Không có thông tin"}
- Nội thất: ${propertyData.furniture || "Không có thông tin"}
- Giấy tờ pháp lý: ${propertyData.legalDocs || "Không có thông tin"}
- Hướng nhà: ${propertyData.houseDirection || "Không có thông tin"}
- Hướng ban công: ${propertyData.balconyDirection || "Không có thông tin"}
- Độ rộng đường: ${propertyData.roadWidth || "Không có thông tin"}
- Mặt tiền: ${propertyData.frontWidth || "Không có thông tin"}

Yêu cầu:
- Mô tả chi tiết các đặc điểm của bất động sản
- Nhấn mạnh những ưu điểm và giá trị của bất động sản
- Đề cập đến vị trí, tiện ích xung quanh và khả năng kết nối
- Mô tả phải chuyên nghiệp, trung thực và hấp dẫn
- Độ dài bắt buộc dưới 1500 ký tự
- Mô tả phải bằng tiếng Việt có dấu
- Chia mô tả thành các đoạn ngắn để dễ đọc
- Giá phải tính thành tỷ, triệu thay vì ghi số ra
- Đầy đủ cấu trúc như sau: mở đầu, mô tả chi tiết, tiện ích, kết nối, pháp lý nhưng không ghi chữ (mở đầu, mô tả chi tiết, tiện ích, kết nối, pháp lý)

Chỉ trả về mô tả, không có giải thích hoặc tiêu đề.`;
  }

  /**
   * Gọi Groq API sử dụng SDK
   */
  private async callGroqAI(prompt: string): Promise<string> {
    try {
      const apiKey = process.env.GROQ_API_KEY;

      // LOG: Kiểm tra API key
      console.log("🔑 GROQ API KEY:", apiKey ? "✅ Available" : "❌ Missing");

      // Nếu không có API key, trả về mẫu demo
      if (!apiKey) {
        console.log("⚠️ No API key found, returning placeholder response");
        return this.getPlaceholderResponse(prompt);
      }

      // LOG: Ghi lại config gọi API
      const config = {
        model: "llama-3.3-70b-versatile",
        maxTokens: 800,
        temperature: 0.3,
        promptLength: prompt.length,
      };
      console.log("🔧 GROQ API Config:", config);

      const startTime = Date.now();
      const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"), // hoặc "llama-3.1-8b"
        prompt: prompt,
        maxTokens: 800,
        temperature: 0.3,
      });
      const endTime = Date.now();

      // LOG: Ghi lại kết quả API
      console.log("📡 GROQ API Response:");
      console.log("- Status: ✅ Success");
      console.log("- API Call Duration:", endTime - startTime, "ms");
      console.log("- Response Length:", text.length);
      console.log(
        "- Raw Response:",
        text.substring(0, 200) + (text.length > 200 ? "..." : "")
      );

      return text.trim();
    } catch (error) {
      console.error("❌ GROQ API ERROR:");
      if (typeof error === "object" && error !== null) {
        console.error("- Error Type:", (error as any).constructor?.name);
        console.error("- Error Message:", (error as any).message);
        console.error("- Error Code:", (error as any).code || "N/A");
        console.error("- Error Stack:", (error as any).stack);

        if ((error as any).response) {
          console.error(
            "- API Response Status:",
            (error as any).response.status
          );
          console.error("- API Response Data:", (error as any).response.data);
        }
      } else {
        console.error("- Error value:", error);
      }

      console.log("⚠️ Falling back to placeholder response due to API error");
      // Trả về mẫu trong trường hợp lỗi
      return this.getPlaceholderResponse(prompt);
    }
  }

  /**
   * Tạo phản hồi mẫu khi không có API key hoặc lỗi kết nối (giữ nguyên)
   */
  private getPlaceholderResponse(prompt: string): string {
    // Nếu là tạo tiêu đề
    if (prompt.includes("Tạo một tiêu đề ngắn gọn")) {
      return "Căn hộ cao cấp 2 phòng ngủ view đẹp tại Vinhomes Central Park";
    }

    // Nếu là tạo mô tả
    return `Căn hộ cao cấp tọa lạc tại vị trí đắc địa thuộc dự án Vinhomes Central Park, Quận Bình Thạnh, TP. Hồ Chí Minh. Căn hộ có diện tích 75m², thiết kế hiện đại với 2 phòng ngủ và 2 phòng tắm.

Nội thất đầy đủ, cao cấp với tủ bếp, máy lạnh, máy giặt và các thiết bị điện tử hiện đại. Căn hộ hướng Đông Nam, đón gió mát quanh năm và view nhìn ra sông Sài Gòn tuyệt đẹp.

Dự án Vinhomes Central Park cung cấp đầy đủ tiện ích như: hồ bơi, phòng gym, công viên, trường học quốc tế, bệnh viện và trung tâm thương mại Vincom. Kết nối thuận tiện đến các quận trung tâm và sân bay Tân Sơn Nhất.

Giấy tờ pháp lý đầy đủ, sổ hồng chính chủ, sẵn sàng giao dịch. Liên hệ ngay để được tư vấn và xem nhà!`;
  }
}
