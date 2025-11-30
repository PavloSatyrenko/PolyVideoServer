import { meetingsController } from "controllers/meetings.controller";
import { Router } from "express";
import { authMiddleware } from "middlewares/auth.middleware";
import { meetingsValidator } from "middlewares/meetings.validator";
import { validate } from "utils/validate";

const router: Router = Router();

router.post("/", authMiddleware, meetingsValidator.createMeetingValidator, validate, meetingsController.createMeeting);
router.get("/recent", authMiddleware, meetingsController.getRecentMeetings);
router.post("/recent/:meetingCode", authMiddleware, meetingsValidator.addMeetingToRecentValidator, validate, meetingsController.addMeetingToRecent);
router.get("/owned", authMiddleware, meetingsController.getOwnedMeetings);
router.get("/:meetingCode", meetingsValidator.getMeetingByCodeValidator, validate, meetingsController.getMeetingByCode);
router.post("/start/:meetingCode", authMiddleware, meetingsValidator.startMeetingValidator, validate, meetingsController.startMeeting);
router.put("/:meetingCode", authMiddleware, meetingsValidator.updateMeetingOptionsValidator, validate, meetingsController.updateMeetingOptions);

export default router;