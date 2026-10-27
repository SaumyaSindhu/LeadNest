import express from "express";
import { getPublicWidgetConfig } from "../controllers/public-widget.controller.js";

const router = express.Router();

router.get("/:id/config", getPublicWidgetConfig);

export default router;
