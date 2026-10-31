const express = require("express");
const { ObjectId } = require("mongodb");
const { getCollection, isInvalidObjectId } = require("../lib/db");
const { verifyToken } = require("../middleware/verifyToken");

const router = express.Router();

/** Exact category vocabulary used across the whole platform. */
const CATEGORIES = [
  "Photo Studio",
  "Film Stage",
  "Podcast Lounge",
  "Music Suite",
  "Art Workshop",
];

const SORTS = {
  priceLow: { hourlyRate: 1 },
  priceHigh: { hourlyRate: -1 },
  rating: { rating: -1 },
  newest: { createdAt: -1 },
};

/** Fields clients may send; everything else is ignored. */
const EDITABLE_FIELDS = [
  "title",
  "category",
  "hourlyRate",
  "securityDeposit",
  "maxCapacity",
  "location",
  "image",
  "amenities",
  "overview",
  "ownerName",
  "ownerEmail",
  "ownerPhoto",
  "rating",
  "totalReviews",
];

const NUMERIC_FIELDS = [
  "hourlyRate",
  "securityDeposit",
  "maxCapacity",
  "rating",
  "totalReviews",
];

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildStudioDocument(body = {}) {
  return {
    title: String(body.title ?? "").trim(),
    category: CATEGORIES.includes(body.category) ? body.category : "",
    hourlyRate: toNumber(body.hourlyRate, 0),
    securityDeposit: toNumber(body.securityDeposit, 0),
    maxCapacity: toNumber(body.maxCapacity, 1),
    location: String(body.location ?? "").trim(),
    image: String(body.image ?? "").trim(),
    amenities: Array.isArray(body.amenities)
      ? body.amenities.map((a) => String(a).trim()).filter(Boolean)
      : [],
    overview: String(body.overview ?? "").trim(),
    ownerName: String(body.ownerName ?? "").trim(),
    ownerEmail: String(body.ownerEmail ?? "").trim().toLowerCase(),
    ownerPhoto: String(body.ownerPhoto ?? "").trim(),
    rating: toNumber(body.rating, 4.5),
    totalReviews: toNumber(body.totalReviews, 0),
    createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
  };
}

/* ------------------------------------------------------------------ */
/* GET /studios                                                        */
/* Query: search (title/location, case-insensitive), category,         */
/*        sort (priceLow|priceHigh|rating|newest), limit               */
/* ------------------------------------------------------------------ */
router.get("/", async (req, res) => {
  try {
    const studios = await getCollection("studios");
    const { search, category, sort, limit } = req.query;

    const filter = {};

    if (search && String(search).trim()) {
      const rx = new RegExp(
        String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      filter.$or = [{ title: rx }, { location: rx }];
    }

    if (category && CATEGORIES.includes(String(category))) {
      filter.category = String(category);
    }

    let cursor = studios.find(filter);
    if (sort && SORTS[sort]) cursor = cursor.sort(SORTS[sort]);

    const limitNum = parseInt(limit, 10);
    if (Number.isFinite(limitNum) && limitNum > 0) {
      cursor = cursor.limit(limitNum);
    }

    const docs = await cursor.toArray();
    return res.status(200).json(docs);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to load studios", error: String(err) });
  }
});

/* GET /studios/my-studios?email= — JWT protected; the token email must
 * match the query email, otherwise 403. Registered BEFORE "/:id" below
 * so "my-studios" is never captured as a studio id. */
async function myStudiosHandler(req, res) {
  try {
    const email = String(req.query.email ?? "").trim().toLowerCase();

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email query parameter is required" });
    }
    if (req.decoded.email !== email) {
      return res
        .status(403)
        .json({ message: "Forbidden: email mismatch with signed-in user" });
    }

    const studios = await getCollection("studios");
    const docs = await studios
      .find({ ownerEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json(docs);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to load your studios", error: String(err) });
  }
}

router.get("/my-studios", verifyToken, myStudiosHandler);

/* GET /studios/:id — single studio, 404 when not found / bad ObjectId */
router.get("/:id", async (req, res) => {
  try {
    const studios = await getCollection("studios");
    const doc = await studios.findOne({ _id: new ObjectId(req.params.id) });

    if (!doc) {
      return res.status(404).json({ message: "Studio not found" });
    }
    return res.status(200).json(doc);
  } catch (err) {
    if (isInvalidObjectId(err)) {
      return res.status(404).json({ message: "Studio not found" });
    }
    return res
      .status(500)
      .json({ message: "Failed to load studio", error: String(err) });
  }
});

/* POST /studios — JWT protected. Creates a studio. */
router.post("/", verifyToken, async (req, res) => {
  try {
    const doc = buildStudioDocument(req.body);

    if (!doc.title || !doc.category || !doc.image || !doc.location) {
      return res.status(400).json({
        message: "Title, category, image and location are required",
      });
    }
    if (doc.ownerEmail && req.decoded.email !== doc.ownerEmail) {
      return res
        .status(403)
        .json({ message: "Forbidden: owner email must match the signed-in account" });
    }

    const studios = await getCollection("studios");
    const result = await studios.insertOne(doc);

    return res.status(201).json({
      success: true,
      message: "Studio created successfully",
      insertedId: result.insertedId,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to create studio", error: String(err) });
  }
});

/* PATCH /studios/:id — JWT protected + owner check. Updates a studio. */
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const studios = await getCollection("studios");
    const existing = await studios.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!existing) {
      return res.status(404).json({ message: "Studio not found" });
    }
    if (req.decoded.email !== existing.ownerEmail) {
      return res
        .status(403)
        .json({ message: "Forbidden: you can only edit your own studios" });
    }

    const updates = {};
    for (const field of EDITABLE_FIELDS) {
      if (!(field in req.body)) continue;

      if (NUMERIC_FIELDS.includes(field)) {
        updates[field] = toNumber(req.body[field], existing[field]);
      } else if (field === "amenities") {
        updates[field] = Array.isArray(req.body.amenities)
          ? req.body.amenities.map((a) => String(a).trim()).filter(Boolean)
          : existing.amenities;
      } else if (field === "category") {
        if (CATEGORIES.includes(req.body.category)) {
          updates[field] = req.body.category;
        }
      } else if (field === "createdAt") {
        if (req.body.createdAt) updates[field] = new Date(req.body.createdAt);
      } else {
        updates[field] = String(req.body[field]).trim();
      }
    }

    const result = await studios.updateOne(
      { _id: existing._id },
      { $set: updates }
    );

    return res.status(200).json({
      success: true,
      message: "Studio updated successfully",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    if (isInvalidObjectId(err)) {
      return res.status(404).json({ message: "Studio not found" });
    }
    return res
      .status(500)
      .json({ message: "Failed to update studio", error: String(err) });
  }
});

/* DELETE /studios/:id — JWT protected + owner check. Deletes a studio. */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const studios = await getCollection("studios");
    const existing = await studios.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!existing) {
      return res.status(404).json({ message: "Studio not found" });
    }
    if (req.decoded.email !== existing.ownerEmail) {
      return res
        .status(403)
        .json({ message: "Forbidden: you can only delete your own studios" });
    }

    await studios.deleteOne({ _id: existing._id });

    // Best-effort cleanup: drop open bookings + wishlist entries for it.
    const bookings = await getCollection("bookings");
    const wishlist = await getCollection("wishlist");
    await Promise.all([
      bookings.deleteMany({ studioId: req.params.id }),
      wishlist.deleteMany({ studioId: req.params.id }),
    ]);

    return res
      .status(200)
      .json({ success: true, message: "Studio deleted successfully" });
  } catch (err) {
    if (isInvalidObjectId(err)) {
      return res.status(404).json({ message: "Studio not found" });
    }
    return res
      .status(500)
      .json({ message: "Failed to delete studio", error: String(err) });
  }
});

module.exports = { router, CATEGORIES, myStudiosHandler };
