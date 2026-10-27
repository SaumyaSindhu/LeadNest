import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import widgetRoutes from "./routes/widget.routes.js";
import publicWidgetRoutes from "./routes/public-widget.routes.js";
import submissionRoutes from "./routes/submission.routes.js";

import { authenticate } from "./middleware/auth.middleware.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/widgets", widgetRoutes);
app.use("/api/public/widgets", publicWidgetRoutes);
app.use("/api/submissions", submissionRoutes);

app.get("/api/auth/me", authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// Handle malformed JSON and oversized request bodies.
app.use((error, req, res, next) => {
  if (error.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body is too large",
    });
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON body",
    });
  }

  next(error);
});

export default app;
