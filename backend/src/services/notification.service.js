import Submission from "../models/Submission.js";

export async function sendLeadNotification(job) {
  const submission = await Submission.findOne({
    _id: job.submissionId,
    tenantId: job.tenantId,
  }).lean();

  if (!submission) {
    throw new Error("Submission not found for notification");
  }

  // Development implementation: simulate an email delivery.
  // Replace this with a real email provider in a later iteration.
  console.log("\n========== LEADNEST EMAIL (SIMULATED) ==========");
  console.log("Tenant:", job.tenantId.toString());
  console.log("Submission:", job.submissionId.toString());
  console.log("Lead data:", JSON.stringify(submission.data, null, 2));
  console.log("================================================\n");
}
