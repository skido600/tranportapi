import jwt from "jsonwebtoken";
import { config } from "dotenv";
config();

export class Tokens {
  private JWT_Secret: string = process.env.JWT_SEC as string;
  private ACCESS_TOKEN_SECRET: string = process.env
    .ACCESS_TOKEN_SECRET as string;
  private REFRESH_TOKEN_SECRET: string = process.env
    .REFRESH_TOKEN_SECRET as string;

  public generateAccessToken(user: any) {
    // console.log("from token", user);
    return jwt.sign(
      {
        _id: user._id,
        email: user.email,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
        full_name: user.full_name,
        userId: user.userId,
        role: user.role,
      },
      this.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
  }

  public generateRefreshToken(user: any) {
    return jwt.sign(
      { id: user._id, email: user.email },
      this.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );
  }

  public generateMailToken(userId: any, full_name: string) {
    return jwt.sign({ userId, full_name }, this.JWT_Secret, {
      expiresIn: "1h",
    });
  }

  public decoded(token: string, secret: string): any {
    console.log(this.ACCESS_TOKEN_SECRET);
    return jwt.verify(token, secret);
  }
}
