import { authValidator } from "middlewares/auth.validator";
import { authController } from "controllers/auth.controller";
import { Router } from "express";
import { authMiddleware } from "middlewares/auth.middleware";
import { validate } from "utils/validate";

const router: Router = Router();

router.post("/signup", authValidator.signUpValidator, validate, authController.signUp);
router.post("/login", authValidator.loginValidator, validate, authController.login);
router.get("/user", authMiddleware, authController.getAuthorizedUser);
router.post("/logout", authMiddleware, authController.logout);
router.post("/refresh", authValidator.refreshTokenValidator, validate, authController.refreshToken);

export default router;