import mongoose from "mongoose";
import Widget from "../models/Widget.js";

const allowedTypes = ["CONTACT_FORM", "SIGNUP_FORM"];

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

// POST /api/widgets
export async function createWidget(req, res) {
  try {
    const { title, type, fields, buttonText } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Widget title is required",
      });
    }

    if (title.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Widget title must be 100 characters or fewer",
      });
    }

    if (type !== undefined && !allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid widget type",
      });
    }

    if (fields !== undefined && !Array.isArray(fields)) {
      return res.status(400).json({
        success: false,
        message: "Fields must be an array",
      });
    }

    if (
      buttonText !== undefined &&
      (typeof buttonText !== "string" || !buttonText.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Button text must be a non-empty string",
      });
    }

    const widget = await Widget.create({
      tenantId: req.user.tenantId,
      title: title.trim(),
      type: type || "CONTACT_FORM",
      fields: fields || [],
      buttonText: buttonText?.trim() || "Submit",
    });

    return res.status(201).json({
      success: true,
      message: "Widget created successfully",
      widget,
    });
  } catch (error) {
    console.error("Create widget error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create widget",
    });
  }
}

// GET /api/widgets
export async function getWidgets(req, res) {
  try {
    const widgets = await Widget.find({
      tenantId: req.user.tenantId,
      deletedAt: null,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: widgets.length,
      widgets,
    });
  } catch (error) {
    console.error("Get widgets error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch widgets",
    });
  }
}

// GET /api/widgets/:id
export async function getWidgetById(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid widget ID",
      });
    }

    const widget = await Widget.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
      deletedAt: null,
    });

    if (!widget) {
      return res.status(404).json({
        success: false,
        message: "Widget not found",
      });
    }

    return res.status(200).json({
      success: true,
      widget,
    });
  } catch (error) {
    console.error("Get widget error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch widget",
    });
  }
}

// PATCH /api/widgets/:id
export async function updateWidget(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid widget ID",
      });
    }

    const { title, type, fields, buttonText, isActive } = req.body;
    const updates = {};

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Title must be between 1 and 100 characters",
        });
      }
      updates.title = title.trim();
    }

    if (type !== undefined) {
      if (!allowedTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid widget type",
        });
      }
      updates.type = type;
    }

    if (fields !== undefined) {
      if (!Array.isArray(fields)) {
        return res.status(400).json({
          success: false,
          message: "Fields must be an array",
        });
      }
      updates.fields = fields;
    }

    if (buttonText !== undefined) {
      if (
        typeof buttonText !== "string" ||
        !buttonText.trim() ||
        buttonText.trim().length > 50
      ) {
        return res.status(400).json({
          success: false,
          message: "Button text must be between 1 and 50 characters",
        });
      }
      updates.buttonText = buttonText.trim();
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false",
        });
      }
      updates.isActive = isActive;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one valid field to update",
      });
    }

    const widget = await Widget.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.user.tenantId,
        deletedAt: null,
      },
      {
        $set: updates,
        $inc: { version: 1 },
      },
      { new: true, runValidators: true },
    );

    if (!widget) {
      return res.status(404).json({
        success: false,
        message: "Widget not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Widget updated successfully",
      widget,
    });
  } catch (error) {
    console.error("Update widget error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update widget",
    });
  }
}

// DELETE /api/widgets/:id
export async function deleteWidget(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid widget ID",
      });
    }

    const widget = await Widget.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.user.tenantId,
        deletedAt: null,
      },
      {
        $set: {
          deletedAt: new Date(),
          isActive: false,
        },
      },
      { new: true },
    );

    if (!widget) {
      return res.status(404).json({
        success: false,
        message: "Widget not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Widget deleted successfully",
    });
  } catch (error) {
    console.error("Delete widget error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete widget",
    });
  }
}
