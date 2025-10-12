import crypto from "crypto";

export function hmacProcess(code: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(code).digest("hex");
}
