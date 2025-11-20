import { body } from "express-validator";

export const chatsValidator = {
    sendMessage: [
        body("receiverId")
            .notEmpty().withMessage("Receiver ID is required")
            .isUUID().withMessage("Receiver ID must be a valid UUID"),
        body("content")
            .trim()
            .notEmpty().withMessage("Content is required")
            .isString().withMessage("Content must be a string")
            .isLength({ min: 1, max: 1000 }).withMessage("Content must be between 1 and 1000 characters")
            .escape(),
    ]
}