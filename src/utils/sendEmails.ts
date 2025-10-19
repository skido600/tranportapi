import fs from "fs";
import path from "path";
import { config } from "dotenv";
config();
interface User {
  email: string;
  full_name: string;
}

export class MailService {
  private EMAIL_API_URL = "https://emailsender-theta.vercel.app/send-email";
  constructor() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Email credentials missing in environment variables");
    }
  }

  public async sendVerification(user: User, verifyUrl: string): Promise<void> {
    const htmlTemplatePath = path.join(process.cwd(), "./src/utils/email.html");
    let htmlContent = fs.readFileSync(htmlTemplatePath, "utf-8");

    htmlContent = htmlContent
      .replace("{{verifyUrl}}", verifyUrl)
      .replace("{{username}}", user.full_name);

    console.log("📧 Sending verification email to:", user.email);

    const sendmail = await fetch(this.EMAIL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: user.email,
        subject: "Verify your email",
        html: htmlContent,
      }),
    });
    console.log("Verification email sent:", sendmail);
  }
  private otpHtmlTemplate(verificationCode: string) {
    return `
      <div style="font-family: Arial, sans-serif; background-color: #f5f6fa; padding: 40px 0;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background-color: #007bff; padding: 20px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0;">Wire Verification</h2>
          </div>
          <div style="padding: 30px; text-align: center; color: #333;">
            <h3 style="margin-bottom: 10px;">Email Verification Code</h3>
            <p style="font-size: 15px; color: #555;">Use the OTP code below to verify your email address.</p>
            <div style="margin: 30px 0;">
              <span style="display: inline-block; background-color: #f0f2f5; color: #111; font-size: 28px; font-weight: bold; letter-spacing: 6px; padding: 15px 25px; border-radius: 8px;">
                ${verificationCode}
              </span>
            </div>
            <p style="font-size: 14px; color: #777;">
              This code will expire in <strong>10 minutes</strong>.<br />
              If you didn’t request this, please ignore this email.
            </p>
          </div>
          <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 13px; color: #999;">
            © ${new Date().getFullYear()} Wire. All rights reserved.
          </div>
        </div>
      </div>
    `;
  }
  public async sendOtp(email: string, verificationCode: string): Promise<void> {
    console.log("📧 Sending OTP to:", email);
    const otpHtml = this.otpHtmlTemplate(verificationCode);
    const res = await fetch(this.EMAIL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: "Your One-Time Verification Code",
        html: otpHtml,
      }),
    });

    const data = await res.json();
    console.log("OTP email response:", data);
  }
}
