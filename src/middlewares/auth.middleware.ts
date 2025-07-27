import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "utils/jwt";

export function authMiddleware(request: Request, response: Response, next: NextFunction): void {
    const accessToken: string | undefined = request.cookies["__Secure-AccessToken"];

    if (!accessToken) {
        response.status(400).json({ message: "Missing access token" });
        return;
    }

    try {
        const userId: number = verifyAccessToken(accessToken).id;
        request.user = { id: userId };
        next();
    } catch {
        response.status(403).json({ message: "Invalid or expired token" });
    }
};