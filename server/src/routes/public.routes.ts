import { Router } from "express";
import * as c from "../controllers/public.controller.js";
import { validate } from "../middleware/validate.js";
import { enquiryLimiter } from "../middleware/rateLimit.js";
import { enquiryCreate, publicProjectQuery, slugParam } from "../schemas/index.js";

export const publicRouter = Router();

publicRouter.get("/health", c.health);
publicRouter.get("/settings", c.getPublicSettings);
publicRouter.get("/projects", validate(publicProjectQuery, "query"), c.listProjects);
publicRouter.get("/projects/:slug", validate(slugParam, "params"), c.getProject);
publicRouter.get("/services", c.listServices);
publicRouter.get("/services/:slug", validate(slugParam, "params"), c.getService);
publicRouter.post("/enquiries", enquiryLimiter, validate(enquiryCreate), c.submitEnquiry);
