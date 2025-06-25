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

      if (
        !propertyData.type ||
        !propertyData.category ||
        !propertyData.location
      ) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin bất động sản",
        });
      }

      // Tạo prompt cho Groq
      const prompt = this.createTitlePrompt(propertyData);

      // Gọi API Groq để tạo tiêu đề
      const title = await this.callGroqAI(prompt);

      res.json({
        success: true,
        title,
      });
    } catch (error) {
      console.error("Lỗi khi tạo tiêu đề:", error);
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

      if (
        !propertyData.type ||
        !propertyData.category ||
        !propertyData.location
      ) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin bất động sản",
        });
      }

      // Tạo prompt cho Groq
      const prompt = this.createDescriptionPrompt(propertyData);

      // Gọi API Groq để tạo mô tả
      const description = await this.callGroqAI(prompt);

      res.json({
        success: true,
        description,
      });
    } catch (error) {
      console.error("Lỗi khi tạo mô tả:", error);
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
- Tiêu đề ngắn gọn, không quá 80 ký tự
- Đặt thông tin quan trọng lên đầu (loại giao dịch, loại BĐS, diện tích, địa điểm)
- Sử dụng các từ ngữ hấp dẫn nhưng không phóng đại
- Tiêu đề phải bằng tiếng Việt có dấu
- Không sử dụng dấu chấm câu ở cuối tiêu đề

Chỉ trả về tiêu đề, không có giải thích.`;
  }

  /**
   * Tạo prompt cho mô tả (giữ nguyên)
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
- Đầy đủ cấu trúc như sau: mở đầu, mô tả chi tiết, tiện ích, kết nối, pháp lý

Chỉ trả về mô tả, không có giải thích hoặc tiêu đề.`;
  }

  /**
   * Gọi Groq API sử dụng SDK
   */
  private async callGroqAI(prompt: string): Promise<string> {
    try {
      const apiKey = process.env.GROQ_API_KEY;

      // Nếu không có API key, trả về mẫu demo
      if (!apiKey) {
        return this.getPlaceholderResponse(prompt);
      }

      const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"), // hoặc "llama-3.1-8b"
        prompt: prompt,
        maxTokens: 800,
        temperature: 0.3,
      });

      return text.trim();
    } catch (error) {
      console.error("Lỗi khi gọi Groq API:", error);
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
