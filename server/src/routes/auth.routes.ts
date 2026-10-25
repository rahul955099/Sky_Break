import { Router } from "express";
import * as c from "../controllers/auth.controller.js";
import { requireAuth, requireCsrf } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { loginBody } from "../schemas/index.js";

export const authRouter = Router();

authRouter.post("/login", loginLimiter, validate(loginBody), c.login);
authRouter.post("/logout", requireAuth, requireCsrf, c.logout);
authRouter.get("/me", requireAuth, c.me);
