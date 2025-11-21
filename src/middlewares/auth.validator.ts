import { body, cookie } from "express-validator";

export const authValidator = {
    signUpValidator: [
        body("email")
            .trim()
            .notEmpty().withMessage("Email is required")
            .isEmail().withMessage("Please provide a valid email address")
            .normalizeEmail(),
        body("name")
            .trim()
            .notEmpty().withMessage("Name is required")
            .isString().withMessage("Name must be a string")
            .isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
        body("surname")
            .trim()
            .notEmpty().withMessage("Surname is required")
            .isString().withMessage("Surname must be a string")
            .isLength({ min: 2, max: 100 }).withMessage("Surname must be between 2 and 100 characters"),
        body("password")
            .trim()
            .notEmpty().withMessage("Password is required")
            .isString().withMessage("Password must be a string")
            .isLength({ min: 6, max: 100 }).withMessage("Password must be between 6 and 100 characters")
    ],
    loginValidator: [
        body("email")
            .trim()
            .notEmpty().withMessage("Email is required")
            .isEmail().withMessage("Please provide a valid email address")
            .normalizeEmail(),
        body("password")
            .trim()
            .notEmpty().withMessage("Password is required")
            .isString().withMessage("Password must be a string")
            .isLength({ min: 6, max: 100 }).withMessage("Password must be between 6 and 100 characters")
    ],
    refreshTokenValidator: [
        cookie("__Secure-RefreshToken")
            .notEmpty().withMessage("Refresh token is required")
    ]
}