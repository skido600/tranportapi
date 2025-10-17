import dotenv from "dotenv";
dotenv.config();

const mongodburl = process.env.MONGOURL;
const port = process.env.PORT;
const JWT_SEC = process.env.JWT_SEC as string;
const frontend_url = process.env.FRONTEND_URL;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;
console.log(REFRESH_TOKEN_SECRET);
const HMAC_VERIFICATION_CODE_SECRET = process.env
  .HMAC_VERIFICATION_CODE_SECRET as string;
export {
  mongodburl,
  port,
  JWT_SEC,
  frontend_url,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  HMAC_VERIFICATION_CODE_SECRET,
};
