import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
const sendverification = async (user: any, verify: any) => {
  const htmlTemplatePath = path.join(process.cwd(), "./src/utils/email.html");
  console.log(htmlTemplatePath);
  let htmlContent = fs.readFileSync(htmlTemplatePath, "utf-8");

  htmlContent = htmlContent
    .replace("{{verifyUrl}}", verify)
    .replace("{{username}}", user.full_name);

  const info = await transporter.sendMail({
    from: `"welcome to transaport term testing" <${process.env.GMAIL_USER}>`,
    to: user.email,
    subject: "Verify your email",
    html: htmlContent,
  });
  console.log("Verification email sent:", info.messageId);
};

//sendotp
async function sendMailOtp(email: string, verificationCode: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let info = await transporter.sendMail({
    from: `  wire otp  <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Verify your email",
    text: `Your verification code is ${verificationCode}. It expires in 10 minutes.`,
  });
  return info;
}

export { sendverification, sendMailOtp };
