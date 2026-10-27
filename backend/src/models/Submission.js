import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    widgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Widget",
      required: true,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    country: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    sourceUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

submissionSchema.index({ tenantId: 1, createdAt: -1 });
submissionSchema.index({ widgetId: 1, createdAt: -1 });

export default mongoose.model("Submission", submissionSchema);
