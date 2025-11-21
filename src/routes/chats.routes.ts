import { chatsController } from "controllers/chats.controller";
import { Router } from "express";
import { authMiddleware } from "middlewares/auth.middleware";
import { chatsValidator } from "middlewares/chats.validator";
import { validate } from "utils/validate";

const router: Router = Router();

router.get("/", authMiddleware, chatsController.getChats);
router.post("/", authMiddleware, chatsValidator.sendMessage, validate, chatsController.sendMessage);
router.get("/:chatUserId", authMiddleware, chatsValidator.getMessages, validate, chatsController.getMessages);

export default router;