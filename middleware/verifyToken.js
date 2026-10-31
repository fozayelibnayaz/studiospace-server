const jwt = require("jsonwebtoken");

/**
 * Reads the httpOnly "token" cookie set by POST /jwt.
 * Missing or invalid token → 401 { message: "Unauthorized access" }.
 */
function verifyToken(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.decoded = decoded; // { email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized access" });
  }
}

function requireSecret() {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET is not set in the server environment");
  }
}

module.exports = { verifyToken, requireSecret };
