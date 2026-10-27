import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { getLeads, getLeadStats } from "../controllers/leads.controller.js";

const router = express.Router();

// All lead-management endpoints require authentication.
router.use(authenticate);

router.get("/", getLeads);
router.get("/stats", getLeadStats);

export default router;
