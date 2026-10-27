import NotificationJob from "../models/NotificationJob.js";
import { sendLeadNotification } from "./notification.service.js";

let isRunning = false;

async function processOneJob() {
  // Recover jobs left processing after a worker crash.
  await NotificationJob.updateMany(
    {
      status: "PROCESSING",
      lockedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) },
    },
    {
      $set: {
        status: "PENDING",
        lockedAt: null,
        nextAttemptAt: new Date(),
      },
    },
  );

  // Atomically claim one due job.
  const job = await NotificationJob.findOneAndUpdate(
    {
      status: "PENDING",
      nextAttemptAt: { $lte: new Date() },
    },
    {
      $set: {
        status: "PROCESSING",
        lockedAt: new Date(),
      },
      $inc: { attempts: 1 },
    },
    {
      returnDocument: "after",
      sort: { nextAttemptAt: 1, createdAt: 1 },
    },
  );

  if (!job) return;

  try {
    await sendLeadNotification(job);

    await NotificationJob.updateOne(
      { _id: job._id, status: "PROCESSING" },
      {
        $set: {
          status: "COMPLETED",
          lockedAt: null,
          lastError: null,
        },
      },
    );

    console.log(`Notification job ${job._id} completed`);
  } catch (error) {
    const exhausted = job.attempts >= job.maxAttempts;

    // Retry after 5 seconds, then 10 seconds, etc.
    const delayMs = 5000 * 2 ** (job.attempts - 1);

    await NotificationJob.updateOne(
      { _id: job._id, status: "PROCESSING" },
      {
        $set: {
          status: exhausted ? "FAILED" : "PENDING",
          lockedAt: null,
          nextAttemptAt: new Date(Date.now() + delayMs),
          lastError: String(error.message || "Notification failed").slice(
            0,
            500,
          ),
        },
      },
    );

    console.error(
      `Notification job ${job._id} failed:`,
      error.message,
      exhausted ? "(retries exhausted)" : "(will retry)",
    );
  }
}

export function startNotificationWorker() {
  if (isRunning) return;
  isRunning = true;

  console.log("LeadNest notification worker started");

  // Process jobs continuously without blocking submission requests.
  setInterval(async () => {
    try {
      await processOneJob();
    } catch (error) {
      console.error("Notification worker error:", error.message);
    }
  }, 2000);
}
