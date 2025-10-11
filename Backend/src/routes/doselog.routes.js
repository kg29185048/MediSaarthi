import { Router } from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import {
  logDose,
  getDoseLogs,
  getUserStats,
  updateDoseLog
} from "../controllers/doselog.controller.js";

const router = Router();

// Log dose (taken/missed) or fetch all dose logs
router.route("/")
  .post(verifyJWT, logDose)
  .get(verifyJWT, getDoseLogs);

// Get user dose statistics (taken/missed count)
router.route("/stats").get(verifyJWT, getUserStats);
router.patch("/:id", verifyJWT, updateDoseLog); 

export default router;
