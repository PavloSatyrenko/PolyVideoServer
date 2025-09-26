import { meetingsController } from "controllers/meetings.controller";
import { Router } from "express";
import { authMiddleware } from "middlewares/auth.middleware";

const router: Router = Router();

router.post("/", authMiddleware, meetingsController.createMeeting);
router.get(":meeting-id/options", meetingsController.getMeetingOptions);

export default router;