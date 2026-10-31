const express = require("express");
const jwt = require("jsonwebtoken");
const { requireSecret } = require("../middleware/verifyToken");

const router = express.Router();

// In production the client and the API live on different origins,
// so the cookie must be SameSite=None + Secure. On localhost Lax works
// and Secure is unnecessary (and would break plain http).
//
// Override with COOKIE_SAMESITE / COOKIE_SECURE if your deployment
// needs something different.
const isProd = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

/* POST /jwt — body: { email }
 * Signs a 7-day JWT for the session and stores it in an httpOnly cookie
 * named "token". The BetterAuth client calls this right after every
 * successful login / register / social login. */
router.post("/jwt", (req, res) => {
  const email = req.body?.email;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  requireSecret();

  const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return res
    .cookie("token", token, cookieOptions)
    .status(200)
    .json({ success: true, cookieName: "token", expiresIn: "7d" });
});

/* POST /logout — clears the token cookie. */
router.post("/logout", (req, res) => {
  return res
    .clearCookie("token", {
      ...cookieOptions,
      maxAge: undefined,
    })
    .status(200)
    .json({ success: true, message: "Logged out" });
});

module.exports = router;
