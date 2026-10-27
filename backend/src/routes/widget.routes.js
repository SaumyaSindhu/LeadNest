import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";

import {
  createWidget,
  getWidgets,
  getWidgetById,
  updateWidget,
  deleteWidget,
} from "../controllers/widget.controller.js";

const router = express.Router();

// All widget management routes require authentication.
router.use(authenticate);

router.post("/", createWidget);
router.get("/", getWidgets);
router.get("/:id", getWidgetById);
router.patch("/:id", updateWidget);
router.delete("/:id", deleteWidget);

export default router;
