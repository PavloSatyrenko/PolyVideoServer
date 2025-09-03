import { ACCESS_TOKEN_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_SECRET, REFRESH_TOKEN_EXPIRES_IN } from "config/env";
import jsonwebtoken from "jsonwebtoken";

export const jwt = {
    generateAccessToken(userId: string): string {
        return jsonwebtoken.sign({ id: userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
    },

    generateRefreshToken(userId: string): string {
        return jsonwebtoken.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
    },

    verifyAccessToken(token: string): { id: string } {
        return jsonwebtoken.verify(token, JWT_SECRET) as { id: string };
    },

    verifyRefreshToken(token: string): { id: string } {
        return jsonwebtoken.verify(token, JWT_REFRESH_SECRET) as { id: string };
    }
}