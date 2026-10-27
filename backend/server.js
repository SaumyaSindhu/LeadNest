import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`LeadNest API running at http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
