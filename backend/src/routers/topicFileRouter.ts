import { Router } from "express";
import { onlyCounselor, onlyManager } from "../middlewares/authorizationMiddleware";
import topicFileController from "../controllers/topicFileController";

const router = Router();

// router.method(Route, [Middleware], Controller.Function)
router.get("/:hash/:fileName", topicFileController.getTopicFile);
router.get("/:hash/", topicFileController.getTopicFiles);
router.post("/:hash/", onlyCounselor, topicFileController.addTopicFile);
router.delete("/:hash/:fileName", onlyManager, topicFileController.deleteTopicFile);
router.delete("/:hash/", onlyManager, topicFileController.deleteAllTopicFiles);

export default router;