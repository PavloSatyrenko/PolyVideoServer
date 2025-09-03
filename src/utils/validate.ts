import { Request, Response, NextFunction } from "express";
import { Result, validationResult } from "express-validator";

export function validate(request: Request, response: Response, next: NextFunction): void {
    const result: Result = validationResult(request);

    if (!result.isEmpty()) {
        response.status(422).json({ message: result.array().map((error: { msg: string }) => error.msg).join(", ") });
        return;
    }

    next();
};