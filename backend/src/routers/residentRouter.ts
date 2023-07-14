import { Router } from "express";
import residentController from "../controllers/residentController";

const router = Router();

router.get("/:wallet", residentController.getResident);

export default router;