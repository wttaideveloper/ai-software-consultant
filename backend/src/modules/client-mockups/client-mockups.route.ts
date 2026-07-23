import { Router } from "express";
import { clientMockupsController } from "./client-mockups.controller.js";

/**
 * Public, unauthenticated — same posture as the rest of the Client Portal.
 *
 * Unlike the other client routes, these can spend real money (one image call per
 * screen), so the service enforces a per-IP window, a per-consultation-key
 * ceiling, and a global daily batch budget before any generation starts. The GET
 * is a pure read so polling and refreshes are always free.
 */
export const clientMockupsRouter = Router();

clientMockupsRouter.post("/", clientMockupsController.generate);
clientMockupsRouter.post("/regenerate", clientMockupsController.regenerate);
clientMockupsRouter.get("/images/:imageId", clientMockupsController.image);
clientMockupsRouter.get("/:consultationKey", clientMockupsController.get);
