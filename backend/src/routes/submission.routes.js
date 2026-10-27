import express from "express";
import { createSubmission } from "../controllers/submission.controller.js";
import submissionRateLimit from "../middleware/submission-rate-limit.js";

const router = express.Router();

router.post("/", submissionRateLimit, createSubmission);

export default router;
