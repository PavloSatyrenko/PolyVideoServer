import { meetingsController } from "controllers/meetings.controller";
import { Router } from "express";
import { authMiddleware } from "middlewares/auth.middleware";
import { meetingsValidator } from "middlewares/meetings.validator";
import { validate } from "utils/validate";

const router: Router = Router();

router.post("/", authMiddleware, meetingsValidator.createMeetingValidator, validate, meetingsController.createMeeting);
router.get(":meeting-id/options", meetingsController.getMeetingOptions);

export default router;