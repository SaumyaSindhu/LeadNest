import mongoose from "mongoose";
import Submission from "../models/Submission.js";
import Widget from "../models/Widget.js";

// GET /api/leads
export async function getLeads(req, res) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );

    const filter = {
      tenantId: req.user.tenantId,
    };

    if (req.query.widgetId) {
      if (!mongoose.isValidObjectId(req.query.widgetId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid widget ID",
        });
      }

      // Confirm the widget belongs to this tenant.
      const widget = await Widget.findOne({
        _id: req.query.widgetId,
        tenantId: req.user.tenantId,
      }).select("_id");

      if (!widget) {
        return res.status(404).json({
          success: false,
          message: "Widget not found",
        });
      }

      filter.widgetId = widget._id;
    }

    const [leads, total] = await Promise.all([
      Submission.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Submission.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get leads error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch leads",
    });
  }
}

// GET /api/leads/stats
export async function getLeadStats(req, res) {
  try {
    const tenantId = new mongoose.Types.ObjectId(req.user.tenantId);

    const [totalSubmissions, widgetStats] = await Promise.all([
      Submission.countDocuments({ tenantId }),
      Submission.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: "$widgetId",
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "widgets",
            localField: "_id",
            foreignField: "_id",
            as: "widget",
          },
        },
        {
          $unwind: {
            path: "$widget",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            widgetId: "$_id",
            title: { $ifNull: ["$widget.title", "Deleted widget"] },
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalSubmissions,
        widgetsWithSubmissions: widgetStats.length,
        submissionsByWidget: widgetStats,
      },
    });
  } catch (error) {
    console.error("Lead stats error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch lead statistics",
    });
  }
}
