import { Router } from "express";
import { login, refreshToken, signUp } from "controllers/auth.controller";

const router: Router = Router();

router.post("/sign-up", signUp);
router.post("/login", login);
router.post("/refresh", refreshToken);

export default router;