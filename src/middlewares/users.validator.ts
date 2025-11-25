import { query } from "express-validator";

export const usersValidator = {
    getUsersToChat: [
        query("search")
            .optional()
            .trim()
            .isString().withMessage("Search query must be a string")
            .isLength({ max: 100 }).withMessage("Search query must be at most 100 characters"),
    ],
}