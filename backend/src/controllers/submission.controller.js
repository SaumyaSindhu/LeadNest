import mongoose from "mongoose";
import Widget from "../models/Widget.js";
import Submission from "../models/Submission.js";

const allowedFieldTypes = ["text", "email", "tel", "number", "textarea"];

const MAX_FIELD_LENGTH = 2000;
const MAX_FIELDS = 30;

function validateFieldValue(field, value) {
  if (typeof value !== "string") {
    return `${field.label} must be a string`;
  }

  if (value.length > MAX_FIELD_LENGTH) {
    return `${field.label} must be ${MAX_FIELD_LENGTH} characters or fewer`;
  }

  if (field.required && !value.trim()) {
    return `${field.label} is required`;
  }

  if (field.type === "email" && value.trim()) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(value.trim())) {
      return `Please enter a valid email address`;
    }
  }

  if (
    field.type === "number" &&
    value.trim() &&
    !Number.isFinite(Number(value))
  ) {
    return `${field.label} must be a valid number`;
  }

  return null;
}

// POST /api/submissions
export async function createSubmission(req, res) {
  try {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        success: false,
        message: "A valid JSON request body is required",
      });
    }

    const { widgetId, data, sourceUrl, _company_website } = req.body;

    // Basic honeypot check. Silently accept the request without storing it.
    if (
      typeof _company_website === "string" &&
      _company_website.trim() !== ""
    ) {
      return res.status(200).json({
        success: true,
        message: "Submission received",
      });
    }

    if (typeof widgetId !== "string" || !mongoose.isValidObjectId(widgetId)) {
      return res.status(400).json({
        success: false,
        message: "A valid widget ID is required",
      });
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: "Submission data must be an object",
      });
    }

    const submittedKeys = Object.keys(data);

    if (submittedKeys.length > MAX_FIELDS) {
      return res.status(400).json({
        success: false,
        message: `A maximum of ${MAX_FIELDS} fields is allowed`,
      });
    }

    const widget = await Widget.findOne({
      _id: widgetId,
      isActive: true,
      deletedAt: null,
    }).lean();

    if (!widget) {
      return res.status(404).json({
        success: false,
        message: "Widget not found or inactive",
      });
    }

    const configuredFields = Array.isArray(widget.fields) ? widget.fields : [];

    if (
      configuredFields.length > MAX_FIELDS ||
      configuredFields.some(
        (field) =>
          !field ||
          typeof field.name !== "string" ||
          !/^[a-zA-Z][a-zA-Z0-9_]{0,49}$/.test(field.name) ||
          typeof field.label !== "string" ||
          !allowedFieldTypes.includes(field.type),
      )
    ) {
      console.error("Invalid field configuration for widget:", widgetId);

      return res.status(500).json({
        success: false,
        message: "Widget configuration is invalid",
      });
    }

    const allowedNames = new Set(configuredFields.map((field) => field.name));

    const unexpectedKey = submittedKeys.find((key) => !allowedNames.has(key));

    if (unexpectedKey) {
      return res.status(400).json({
        success: false,
        message: `Unexpected field: ${unexpectedKey}`,
      });
    }

    for (const field of configuredFields) {
      const value = data[field.name];

      if (value === undefined || value === null) {
        if (field.required) {
          return res.status(400).json({
            success: false,
            message: `${field.label} is required`,
          });
        }
        continue;
      }

      const validationError = validateFieldValue(field, value);

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }
    }

    let safeSourceUrl = null;

    if (typeof sourceUrl === "string" && sourceUrl.length <= 2048) {
      try {
        const parsedUrl = new URL(sourceUrl);

        if (["http:", "https:"].includes(parsedUrl.protocol)) {
          safeSourceUrl = parsedUrl.toString();
        }
      } catch {
        // Ignore invalid source URLs; the lead can still be stored.
      }
    }

    const submission = await Submission.create({
      // Always derive ownership from the database widget, never the request.
      tenantId: widget.tenantId,
      widgetId: widget._id,
      data,
      sourceUrl: safeSourceUrl,
    });

    return res.status(201).json({
      success: true,
      message: "Submission saved successfully",
      submissionId: submission._id,
    });
  } catch (error) {
    if (error.type === "entity.too.large") {
      return res.status(413).json({
        success: false,
        message: "Request body is too large",
      });
    }

    console.error("Create submission error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to save submission",
    });
  }
}
