import { body, param } from "express-validator";

export const meetingsValidator = {
    createMeetingValidator: [
        body("title")
            .optional({ values: "falsy" })
            .trim()
            .notEmpty().withMessage("Title is required")
            .isString().withMessage("Title must be a string")
            .isLength({ min: 2, max: 200 }).withMessage("Title must be between 2 and 200 characters"),
        body("isGuestAllowed")
            .notEmpty().withMessage("isGuestAllowed is required")
            .isBoolean().withMessage("isGuestAllowed must be a boolean"),
        body("isWaitingRoom")
            .notEmpty().withMessage("isWaitingRoom is required")
            .isBoolean().withMessage("isWaitingRoom must be a boolean"),
        body("isScreenSharing")
            .notEmpty().withMessage("isScreenSharing is required")
            .isBoolean().withMessage("isScreenSharing must be a boolean"),
        body("isPlanned")
            .notEmpty().withMessage("isPlanned is required")
            .isBoolean().withMessage("isPlanned must be a boolean"),
        body("startTime")
            .optional()
            .isISO8601().withMessage("startTime must be a valid ISO 8601 date string")
            .toDate(),
    ],

    getMeetingByCodeValidator: [
        param("meetingCode")
            .notEmpty().withMessage("Meeting code is required")
            .isString().withMessage("Meeting code must be a valid string"),
    ],

    addMeetingToRecentValidator: [
        param("meetingCode")
            .notEmpty().withMessage("Meeting code is required")
            .isString().withMessage("Meeting code must be a valid string"),
    ],

    startMeetingValidator: [
        param("meetingCode")
            .notEmpty().withMessage("Meeting code is required")
            .isString().withMessage("Meeting code must be a valid string"),
    ],

    updateMeetingOptionsValidator: [
        param("meetingCode")
            .notEmpty().withMessage("Meeting code is required")
            .isString().withMessage("Meeting code must be a valid string"),
        body("isWaitingRoom")
            .notEmpty().withMessage("isWaitingRoom is required")
            .isBoolean().withMessage("isWaitingRoom must be a boolean"),
        body("isScreenSharing")
            .notEmpty().withMessage("isScreenSharing is required")
            .isBoolean().withMessage("isScreenSharing must be a boolean"),
        body("isGuestAllowed")
            .notEmpty().withMessage("isGuestAllowed is required")
            .isBoolean().withMessage("isGuestAllowed must be a boolean"),
    ]
};