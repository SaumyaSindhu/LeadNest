import mongoose from "mongoose";
import Widget from "../models/Widget.js";

const allowedFieldTypes = ["text", "email", "tel", "number", "textarea"];

export async function getPublicWidgetConfig(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid widget ID",
      });
    }

    const widget = await Widget.findOne({
      _id: id,
      isActive: true,
      deletedAt: null,
    }).lean();

    if (!widget) {
      return res.status(404).json({
        success: false,
        message: "Widget not found or inactive",
      });
    }

    // Return only fields intended to be displayed publicly.
    const fields = (Array.isArray(widget.fields) ? widget.fields : [])
      .filter(
        (field) =>
          field &&
          typeof field.name === "string" &&
          typeof field.label === "string" &&
          allowedFieldTypes.includes(field.type),
      )
      .map((field) => ({
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.required === true,
        ...(typeof field.placeholder === "string"
          ? { placeholder: field.placeholder }
          : {}),
      }));

    // Public configuration can be cached briefly by browsers and proxies.
    res.set("Cache-Control", "public, max-age=60, s-maxage=300");
    res.set("Vary", "Origin");

    return res.status(200).json({
      success: true,
      widget: {
        id: widget._id.toString(),
        title: widget.title,
        type: widget.type,
        fields,
        buttonText: widget.buttonText,
        version: widget.version,
      },
    });
  } catch (error) {
    console.error("Public widget config error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load widget configuration",
    });
  }
}
