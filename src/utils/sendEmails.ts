import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { config } from "dotenv";
config();
interface User {
  email: string;
  full_name: string;
}

export class MailService {
  private transporter: ReturnType<typeof nodemailer.createTransport>;

  constructor() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Email credentials missing in environment variables");
    }

    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  public async sendVerification(user: User, verifyUrl: string): Promise<void> {
    const htmlTemplatePath = path.join(process.cwd(), "./src/utils/email.html");
    let htmlContent = fs.readFileSync(htmlTemplatePath, "utf-8");

    htmlContent = htmlContent
      .replace("{{verifyUrl}}", verifyUrl)
      .replace("{{username}}", user.full_name);

    console.log("📧 Sending verification email to:", user.email);

    const sendmail = await fetch(
      "https://emailsender-theta.vercel.app/send-email",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: user.email,
          subject: "Verify your email",
          html: htmlContent,
        }),
      }
    );
    console.log("Verification email sent:", sendmail);
  }

  public async sendOtp(email: string, verificationCode: string): Promise<void> {
    console.log("📧 Sending OTP to:", email);

    const info = await this.transporter.sendMail({
      from: `Wire OTP <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your email",
      text: `Your verification code is ${verificationCode}. It expires in 10 minutes.`,
    });

    console.log("OTP email sent:", info.messageId);
  }
}
