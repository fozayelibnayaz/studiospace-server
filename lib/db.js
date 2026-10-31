require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.DB_NAME || "studiospaceDB";

let client;
let dbInstance;

async function getDb() {
  if (dbInstance) return dbInstance;

  if (!client) {
    client = new MongoClient(uri, {
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
