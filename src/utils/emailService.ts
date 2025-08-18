import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

interface EmailConfig {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Kiểm tra cấu hình email
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn(
        "⚠️ Email configuration missing. Email features will be disabled."
      );
      console.warn(`GMAIL_USER: ${process.env.GMAIL_USER ? "Set" : "Missing"}`);
      console.warn(
        `GMAIL_APP_PASSWORD: ${
          process.env.GMAIL_APP_PASSWORD ? "Set" : "Missing"
        }`
      );
      return;
    }

    try {
      // Tạo transporter với Gmail
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      console.log("✅ Email transporter created successfully");

      // Verify connection
      this.verifyConnection();
    } catch (error) {
      console.error("❌ Failed to create email transporter:", error);
      this.transporter = null;
    }
  }

  private async verifyConnection(): Promise<void> {
    try {
      if (!this.transporter) {
        console.warn("⚠️ Email transporter not available for verification");
        return;
      }

      await this.transporter.verify();
      console.log("✅ Email service connected successfully");
    } catch (error) {
      console.error("❌ Email service connection failed:", error);
      this.transporter = null;
    }
  }

  async sendEmail(config: EmailConfig): Promise<boolean> {
    try {
      console.log(
        `📤 [EmailService] Attempting to send email to: ${config.to}`
      );

      if (!this.transporter) {
        console.error("❌ Email transporter not configured");
        return false;
      }

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || "Real Estate"} <${
          process.env.GMAIL_USER
        }>`,
        to: config.to,
        subject: config.subject,
        html: config.html,
        text: config.text || this.htmlToText(config.html),
      };

      console.log(`📮 [EmailService] Mail options prepared, sending...`);

      const info = await this.transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully:", info.messageId);
      return true;
    } catch (error) {
      console.error("❌ Failed to send email:", error);
      return false;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<boolean> {
    console.log(`📧 [EmailService] Preparing to send reset email to: ${email}`);

    const resetLink = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password/${resetToken}`;

    console.log(`🔗 [EmailService] Reset link generated: ${resetLink}`);

    const htmlContent = this.generatePasswordResetHTML(resetLink);

    console.log(`✉️ [EmailService] Calling sendEmail...`);

    const result = await this.sendEmail({
      to: email,
      subject: "Đặt lại mật khẩu - Real Estate Platform",
      html: htmlContent,
    });

    console.log(`📬 [EmailService] Email send result: ${result}`);

    return result;
  }

  private generatePasswordResetHTML(resetLink: string): string {
    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đặt lại mật khẩu</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #e03c31;
            margin-bottom: 10px;
          }
          .title {
            color: #333;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
            line-height: 1.8;
          }
          .reset-button {
            display: inline-block;
            background-color: #e03c31;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .reset-button:hover {
            background-color: #ed685eff;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
            text-align: center;
          }
          .link-backup {
            word-break: break-all;
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏠 Real Estate Platform</div>
          </div>
          
          <h2 class="title">Đặt lại mật khẩu</h2>
          
          <div class="content">
            <p>Xin chào,</p>
            <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn trên Real Estate Platform.</p>
            <p>Để đặt lại mật khẩu, vui lòng nhấp vào nút bên dưới:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="reset-button" style="color: white;">Đặt lại mật khẩu</a>
            </div>
            
            <p>Hoặc sao chép và dán đường link sau vào trình duyệt của bạn:</p>
            <div class="link-backup">${resetLink}</div>
          </div>
          
          <div class="warning">
            <strong>⚠️ Lưu ý quan trọng:</strong>
            <ul>
              <li>Link này chỉ có hiệu lực trong <strong>1 giờ</strong></li>
              <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
              <li>Không chia sẻ link này với bất kỳ ai khác</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>Trân trọng,<br>Đội ngũ Real Estate Platform</p>
            <p>
              <small>
                Email này được gửi tự động, vui lòng không reply.
                <br>Nếu bạn cần hỗ trợ, hãy liên hệ với chúng tôi qua website.
              </small>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private htmlToText(html: string): string {
    // Convert HTML to plain text (simple implementation)
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();
  }
}

export default new EmailService();
