import { Router } from "express";
import { z } from "zod";
import * as c from "../controllers/admin.controller.js";
import { requireAuth, requireCsrf, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  adminProjectQuery,
  enquiryNoteCreate,
  enquiryQuery,
  enquiryUpdate,
  idParam,
  projectInput,
  reorderInput,
  serviceInput,
  settingsInput,
} from "../schemas/index.js";
import { imageUpload } from "../services/upload.service.js";

export const adminRouter = Router();

// Every admin route requires a valid session; mutations also require the CSRF token.
adminRouter.use(requireAuth, requireCsrf, (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

const byId = validate(idParam, "params");
const editor = requireRole("EDITOR");
const admin = requireRole("ADMIN");

adminRouter.get("/dashboard", editor, c.dashboard);

// Projects & services: editors and above
adminRouter.get("/projects", editor, validate(adminProjectQuery, "query"), c.listProjects);
adminRouter.post("/projects", editor, validate(projectInput), c.createProject);
adminRouter.get("/projects/:id", editor, byId, c.getProject);
adminRouter.put("/projects/:id", editor, byId, validate(projectInput), c.updateProject);
adminRouter.patch("/projects/:id/publish", editor, byId, validate(z.object({ isPublished: z.boolean() })), c.publishProject);
adminRouter.delete("/projects/:id", admin, byId, c.deleteProject);

adminRouter.get("/services", editor, c.listServices);
adminRouter.post("/services", editor, validate(serviceInput), c.createService);
adminRouter.put("/services/reorder", editor, validate(reorderInput), c.reorderServices);
adminRouter.get("/services/:id", editor, byId, c.getService);
adminRouter.put("/services/:id", editor, byId, validate(serviceInput), c.updateService);
adminRouter.delete("/services/:id", admin, byId, c.deleteService);

adminRouter.post("/uploads", editor, imageUpload.single("image"), c.uploadImage);

// Enquiries contain personal data: admins and owners only
adminRouter.get("/enquiries", admin, validate(enquiryQuery, "query"), c.listEnquiries);
adminRouter.get("/enquiries/export", admin, c.exportEnquiries);
adminRouter.get("/enquiries/:id", admin, byId, c.getEnquiry);
adminRouter.patch("/enquiries/:id", admin, byId, validate(enquiryUpdate), c.updateEnquiry);
adminRouter.post("/enquiries/:id/notes", admin, byId, validate(enquiryNoteCreate), c.addEnquiryNote);
adminRouter.delete("/enquiries/:id", admin, byId, c.deleteEnquiry);

adminRouter.get("/settings", admin, c.getAdminSettings);
adminRouter.put("/settings", admin, validate(settingsInput), c.putAdminSettings);
