/**
 * Vercel serverless entry for the StudioSpace API.
 *
 * Vercel treats every file inside /api as a function. Exporting the Express
 * app (which is a valid (req, res) handler) means every request routed here by
 * vercel.json is handled by the exact same routes used by the local server.
 *
 * MongoDB connects lazily inside lib/db.js and is cached per warm instance.
 */
const app = require("../app");

module.exports = app;
