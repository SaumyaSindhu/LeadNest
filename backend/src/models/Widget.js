import mongoose from "mongoose";

const widgetSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["CONTACT_FORM", "SIGNUP_FORM"],
      default: "CONTACT_FORM",
    },
    fields: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
      default: [],
    },
    buttonText: {
      type: String,
      default: "Submit",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

widgetSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model("Widget", widgetSchema);
