/**
 * Local bootstrap.
 *
 * The Express app itself lives in app.js so it can be shared by:
 *   - this long-running server (npm start / npm run dev)
 *   - Vercel's serverless entry (api/index.js)
 */
const app = require("./app");
const { getDb } = require("./lib/db");

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await getDb();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(
        `⭐ StudioSpace server listening on port ${PORT} (${process.env.NODE_ENV || "development"})`
      );
      // eslint-disable-next-line no-console
      console.log(`  Allowed origins: ${app.allowedOrigins.join(", ")}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to connect to MongoDB:", err.message);
  }
}

start();

module.exports = app;
