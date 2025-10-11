import { Router } from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import { getDashboardData } from "../controllers/dashboard.controller.js";

const router = Router();

// Fetch dashboard summary data (total meds, adherence rate, etc.)
router.route("/").get(verifyJWT, getDashboardData);

export default router;
