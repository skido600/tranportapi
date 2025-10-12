import crypto from "crypto";

function Otpcode(): string {
  const verificationCode = crypto.randomInt(100000, 999999).toString();
  return verificationCode;
}

export default Otpcode;
