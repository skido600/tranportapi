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

  //senddriver email

  public async sendBookingNotification(data: {
    driverName: string;
    driverEmail: string;
    userPickup: string;
    userDestination: string;
    tripDate: string;
    price: number;
    userbookname: string;
  }) {
    const {
      driverName,
      driverEmail,
      userPickup,
      userDestination,
      tripDate,
      price,
      userbookname,
    } = data;

    // background-color: #f5f6fa
    const bookingHtmlTemplate = `
      <div style="font-family: Arial, sans-serif; padding: 40px 0;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background-color: #0A1F5C; padding: 20px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0;">New Trip Booking Received!</h2>
          </div>
          <div style="padding: 30px; color: #333;">
            <p>Hi ${driverName},</p>
            <p>You have received a new trip booking request from ${userbookname} with the following details:</p>
            <ul>
              <li><strong>Pickup Location:</strong> ${userPickup}</li>
              <li><strong>Destination:</strong> ${userDestination}</li>
              <li><strong>Trip Date & Time:</strong> ${tripDate}</li>
              <li><strong>Price:</strong> ₦${price.toLocaleString()}</li>
            </ul>
            <p>Please review the booking and take appropriate action in your dashboard.</p>
            <p>Thanks, <br />Transport App Team</p>
          </div>
          <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 13px; color: #999;">
            © ${new Date().getFullYear()} Transport App. All rights reserved.
          </div>
        </div>
      </div>
    `;

    console.log("📧 Sending booking email to:", driverEmail);

    await fetch(this.EMAIL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: driverEmail,
        subject: "New Trip Booking Received",
        html: bookingHtmlTemplate,
      }),
    });
  }

  public async sendTripAcceptedMail(data: {
    userEmail: string;
    driverName: any;
    pickup: any;
    destination: any;
    tripDate: any;
    drivernumber: any;
  }) {
    const {
      userEmail,
      driverName,
      pickup,
      destination,
      tripDate,
      drivernumber,
    } = data;

    const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f5f6fa; padding: 40px 0;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #28a745; padding: 20px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0;">Trip Accepted ✅</h2>
        </div>
        <div style="padding: 30px; color: #333;">
          <p>Hi there,</p>
          <p>Your booking has been <strong>accepted</strong> by ${driverName}.</p>
          <ul>
            <li><strong>Pickup:</strong> ${pickup}</li>
            <li><strong>Destination:</strong> ${destination}</li>
            <li><strong>Trip Date:</strong> ${tripDate}</li>
              <li><strong>Trip Date:</strong>driver phone number ${drivernumber}</li>
          </ul>
          <p>Please prepare for your trip and stay in touch with your driver.</p>
          <p>Thanks for using <strong>Transport App</strong> 🚚</p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 13px; color: #999;">
          © ${new Date().getFullYear()} Transport App. All rights reserved.
        </div>
      </div>
    </div>
  `;

    console.log("📧 Sending trip accepted email to:", userEmail);

    await fetch(this.EMAIL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: userEmail,
        subject: "Your Trip Has Been Accepted",
        html,
      }),
    });
  }

  // Trip Rejected Email
  public async sendTripRejectedMail(data: {
    userEmail: string;
    driverName: any;
    pickup: any;
    destination: any;
    tripDate: any;
  }) {
    const { userEmail, driverName, pickup, destination, tripDate } = data;

    const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f5f6fa; padding: 40px 0;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #dc3545; padding: 20px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0;">Trip Rejected ❌</h2>
        </div>
        <div style="padding: 30px; color: #333;">
          <p>Hi there,</p>
          <p>Unfortunately, ${driverName} has <strong>rejected</strong> your trip request.</p>
          <ul>
            <li><strong>Pickup:</strong> ${pickup}</li>
            <li><strong>Destination:</strong> ${destination}</li>
            <li><strong>Trip Date:</strong> ${tripDate}</li>
          </ul>
          <p>Don't worry! You can request another driver anytime.</p>
          <p>Thanks for using <strong>Transport App</strong> 🚚</p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 13px; color: #999;">
          © ${new Date().getFullYear()} Transport App. All rights reserved.
        </div>
      </div>
    </div>
  `;

    console.log("📧 Sending trip rejected email to:", userEmail);

    await fetch(this.EMAIL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: userEmail,
        subject: "Your Trip Has Been Rejected",
        html,
      }),
    });
  }
}
