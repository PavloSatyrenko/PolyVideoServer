import { ACCESS_TOKEN_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_SECRET, REFRESH_TOKEN_EXPIRES_IN } from "config/env";
import jwt from "jsonwebtoken";

export function generateAccessToken(userId: number): string {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

export function generateRefreshToken(userId: number): string {
    return jwt.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

export function verifyAccessToken(token: string): { id: number } {
    return jwt.verify(token, JWT_SECRET) as { id: number };
}

export function verifyRefreshToken(token: string): { id: number } {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { id: number };
}