import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const submissionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Maximum 5 requests per IP + widget per window
  standardHeaders: "draft-8",
  legacyHeaders: false,

  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req.ip || req.socket.remoteAddress || "unknown");

    const widgetId =
      typeof req.body?.widgetId === "string"
        ? req.body.widgetId
        : "unknown-widget";

    return `${ip}:${widgetId}`;
  },

  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "Too many submissions. Please try again later.",
    });
  },
});

export default submissionRateLimit;