import { usersController } from "controllers/users.controller";
import { Router } from "express";
import { authMiddleware } from "middlewares/auth.middleware";
import { usersValidator } from "middlewares/users.validator";
import { validate } from "utils/validate";

const router: Router = Router();

router.get("/", authMiddleware, usersValidator.getUsersToChat, validate, usersController.getUsersToChat);

export default router;