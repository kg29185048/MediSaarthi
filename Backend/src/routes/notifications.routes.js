import express from "express";
import { savePushSubscription } from "../controllers/notification.controller.js";
import verifyJWT from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/subscribe", verifyJWT, savePushSubscription);

export default router;
