import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { authorize } from "../auth/authorization.middleware.js";
import { PERMISSIONS } from "../auth/permissions.constants.js";
import { settingsController } from "./settings.controller.js";

export const settingsRouter = Router();

settingsRouter.get(
  "/organization",
  authenticate,
  authorize(PERMISSIONS.SETTINGS_READ),
  settingsController.getOrganizationSettings,
);

settingsRouter.patch(
  "/organization",
  authenticate,
  authorize(PERMISSIONS.SETTINGS_UPDATE),
  settingsController.updateOrganizationSettings,
);

settingsRouter.get(
  "/user",
  authenticate,
  authorize(PERMISSIONS.SETTINGS_READ),
  settingsController.getUserSettings,
);

settingsRouter.patch(
  "/user",
  authenticate,
  authorize(PERMISSIONS.SETTINGS_UPDATE),
  settingsController.updateUserSettings,
);
