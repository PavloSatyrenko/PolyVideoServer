import { Request, Response, NextFunction } from "express";
import { jwt } from "utils/jwt";

export function authMiddleware(request: Request, response: Response, next: NextFunction): void {
    const accessToken: string | undefined = request.cookies["__Secure-AccessToken"];

    if (!accessToken) {
        response.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const user: { id: string } = jwt.verifyAccessToken(accessToken);
        request.user = { id: user.id };
        next();
    } catch {
        response.status(401).json({ message: "Unauthorized" });
    }
};