import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { authorize } from "../auth/authorization.middleware.js";
import { PERMISSIONS } from "../auth/permissions.constants.js";
import { costSettingsController } from "./cost.controller.js";

/**
 * Cost Management — the pricing engine's configuration API.
 *
 * Reads need COST_SETTINGS_VIEW; every write needs COST_SETTINGS_EDIT, so a
 * consultant can see the rate card a quote was built from without being able to
 * change what the company charges.
 *
 * The preview endpoint is a read: it calculates but persists nothing.
 */
export const costSettingsRouter = Router();

costSettingsRouter.get(
  "/",
  authenticate,
  authorize(PERMISSIONS.COST_SETTINGS_VIEW),
  costSettingsController.getConfiguration,
);

costSettingsRouter.patch(
  "/",
  authenticate,
  authorize(PERMISSIONS.COST_SETTINGS_EDIT),
  costSettingsController.updateSettings,
);

costSettingsRouter.get(
  "/preview",
  authenticate,
  authorize(PERMISSIONS.COST_SETTINGS_VIEW),
  costSettingsController.preview,
);

/**
 * Rate card sub-resources, mounted at their own top-level paths
 * (/api/hourly-rates, /api/complexity-multipliers, /api/platform-multipliers).
 */
export const hourlyRatesRouter = Router();

hourlyRatesRouter.get(
  "/",
  authenticate,
  authorize(PERMISSIONS.COST_SETTINGS_VIEW),
  costSettingsController.getHourlyRates,
);

hourlyRatesRouter.patch(
  "/",
  authenticate,
  authorize(PERMISSIONS.COST_SETTINGS_EDIT),
  costSettingsController.updateHourlyRates,
);

/**
 * @deprecated Complexity multipliers no longer affect any price — the engine
 * stopped reading them (see cost.engine.ts). The endpoints remain so stored rows
 * stay reachable and no existing caller 404s; the Admin UI no longer renders or
 * writes them. Remove alongside the table in a later, deliberate cleanup.
 */
export const complexityMultipliersRouter = Router();

complexityMultipliersRouter.get(
  "/",
  authenticate,
  authorize(PERMISSIONS.COST_SETTINGS_VIEW),
  costSettingsController.getComplexityMultipliers,
);

complexityMultipliersRouter.patch(
  "/",
  authenticate,
  authorize(PERMISSIONS.COST_SETTINGS_EDIT),
  costSettingsController.updateComplexityMultipliers,
);

export const platformMultipliersRouter = Router();

platformMultipliersRouter.get(
  "/",
  authenticate,
  authorize(PERMISSIONS.COST_SETTINGS_VIEW),
  costSettingsController.getPlatformMultipliers,
);

platformMultipliersRouter.patch(
  "/",
  authenticate,
  authorize(PERMISSIONS.COST_SETTINGS_EDIT),
  costSettingsController.updatePlatformMultipliers,
);
