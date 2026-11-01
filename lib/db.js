require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

/**
 * Connection string resolution.
 * - Reads MONGODB_URI, trimming stray whitespace/newlines that easily sneak in
 *   when pasting into a hosting dashboard.
 * - Refuses to silently fall back to localhost in production: that produced a
 *   confusing "ECONNREFUSED 127.0.0.1:27017" from a serverless function whose
 *   only real problem was a missing environment variable.
 * - Keeps the localhost fallback for local development only.
 */
const configuredUri = String(process.env.MONGODB_URI ?? "").trim();
const uri = configuredUri || "mongodb://127.0.0.1:27017";
const dbName = (process.env.DB_NAME || "studiospaceDB").trim();

let client;
let dbInstance;

async function getDb() {
  if (dbInstance) return dbInstance;

  if (!configuredUri && process.env.NODE_ENV === "production") {
    throw new Error(
      "MONGODB_URI is not set. Add your MongoDB Atlas connection string to the production environment."
    );
  }

  if (!client) {
    client = new MongoClient(uri, {
      // Fail fast instead of hanging until the serverless timeout fires.
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      maxPoolSize: 10,
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
      },
    });
  }

  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }

  dbInstance = client.db(dbName);
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(` MongoDB connected → db: ${dbName}`);
  }
  return dbInstance;
}

async function getCollection(name) {
  const db = await getDb();
  return db.collection(name);
}

/**
 * Normalize MongoDB errors so the API never leaks driver internals.
 */
function isInvalidObjectId(err) {
  return (
    err &&
    (err.name === "BSONError" ||
      err.name === "BSONTypeError" ||
      /Cast to ObjectId failed/i.test(String(err.message)))
  );
}

module.exports = { getDb, getCollection, isInvalidObjectId };
