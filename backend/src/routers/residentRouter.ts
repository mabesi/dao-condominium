import { Router } from "express";
import residentController from "../controllers/residentController";
import { onlyCounselor, onlyManager } from "../middlewares/authorizationMiddleware";

const router = Router();

// router.method(Route, [Middleware], Controller.Function)
router.get("/:wallet", residentController.getResident);
router.post("/", onlyCounselor, residentController.postResident);
router.patch("/:wallet", onlyManager, residentController.patchResident);
router.delete("/:wallet", onlyManager, residentController.deleteResident);

export default router;