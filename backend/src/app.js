import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import widgetRoutes from "./routes/widget.routes.js";
import publicWidgetRoutes from "./routes/public-widget.routes.js";

import { authenticate } from "./middleware/auth.middleware.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/widgets", widgetRoutes);
app.use("/api/public/widgets", publicWidgetRoutes);

app.get("/api/auth/me", authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

export default app;
