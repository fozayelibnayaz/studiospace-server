require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { getDb } = require("./lib/db");
const authRoutes = require("./routes/auth");
const {
  router: studioRoutes,
  CATEGORIES,
  myStudiosHandler,
} = require("./routes/studios");
const bookingRoutes = require("./routes/bookings");
const wishlistRoutes = require("./routes/wishlist");
const { verifyToken } = require("./middleware/verifyToken");

const app = express();

/** Origins: CLIENT_URL may list several origins, comma separated.
 * Trailing slashes are stripped because browsers never send them in the
 * Origin header — a pasted "https://app.vercel.app/" would otherwise block
 * every credentialed request in production. */
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow same-origin/server-side tools (no Origin header) and
      // any origin explicitly listed in CLIENT_URL.
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);

// json + urlencoded with a generous limit so base64 studio images still work
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

/* Health check */
app.get("/", (req, res) => {
  res.status(200).send("StudioSpace server is up and running.");
});

/* Data-API introspection used by the client to stay in sync.
 * "database" reports whether the function can actually see MONGODB_URI —
 * the fastest way to diagnose a deploy that fell back to localhost. */
app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    categories: CATEGORIES,
    env: process.env.NODE_ENV || "development",
    database: String(process.env.MONGODB_URI ?? "").trim()
      ? "configured"
      : "missing",
  });
});

app.use("/", authRoutes);
app.use("/studios", studioRoutes);
/* Spec route: GET /my-studios?email= (alias of /studios/my-studios) */
app.get("/my-studios", verifyToken, myStudiosHandler);
app.use("/bookings", bookingRoutes);
app.use("/wishlist", wishlistRoutes);

/* 404 for unknown API routes (Express 5 requires an explicit name for the catch-all) */
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
});

/* Central error handler */
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  // CORS origin rejections come through as generic Errors — give them 403.
  const isCorsError = /^Origin .* is not allowed by CORS/.test(err.message || "");
  const status = isCorsError ? 403 : err.status || 500;
  res.status(status).json({
    message: err.message || "Internal server error",
  });
});

module.exports = app;
module.exports.allowedOrigins = allowedOrigins;
module.exports.getDb = getDb;
