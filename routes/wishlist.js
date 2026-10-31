const express = require("express");
const { ObjectId } = require("mongodb");
const { getCollection, isInvalidObjectId } = require("../lib/db");
const { verifyToken } = require("../middleware/verifyToken");

const router = express.Router();

/* POST /wishlist — JWT protected.
 * Body: the studio doc (or at least studioId + display fields) plus the
 * user email from the signed token. One saved studio per user. */
router.post("/", verifyToken, async (req, res) => {
  try {
    const body = req.body ?? {};
    const studioId = String(body.studioId ?? body._id ?? "");

    if (!ObjectId.isValid(studioId)) {
      return res.status(400).json({ message: "Invalid studio id" });
    }

    const wishlist = await getCollection("wishlist");
    const doc = {
      studioId,
      userEmail: req.decoded.email,
      title: String(body.title ?? "").trim(),
      category: String(body.category ?? "").trim(),
      image: String(body.image ?? "").trim(),
      location: String(body.location ?? "").trim(),
      hourlyRate: Number(body.hourlyRate) || 0,
      rating: Number(body.rating) || 0,
      ownerEmail: String(body.ownerEmail ?? "").trim(),
      createdAt: new Date(),
    };

    await wishlist.deleteOne({ studioId, userEmail: doc.userEmail });
    const result = await wishlist.insertOne(doc);

    return res.status(201).json({
      success: true,
      message: "Saved to wishlist",
      insertedId: result.insertedId,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to save wishlist item", error: String(err) });
  }
});

/* GET /wishlist?email= — JWT protected; token email must match query. */
router.get("/", verifyToken, async (req, res) => {
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

    const wishlist = await getCollection("wishlist");
    const docs = await wishlist
      .find({ userEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json(docs);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to load wishlist", error: String(err) });
  }
});

/* DELETE /wishlist/:id — JWT protected; only the owner can unsave. */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const wishlist = await getCollection("wishlist");
    const item = await wishlist.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!item) {
      return res.status(404).json({ message: "Wishlist item not found" });
    }
    if (req.decoded.email !== item.userEmail) {
      return res
        .status(403)
        .json({ message: "Forbidden: not your wishlist item" });
    }

    await wishlist.deleteOne({ _id: item._id });
    return res
      .status(200)
      .json({ success: true, message: "Removed from wishlist" });
  } catch (err) {
    if (isInvalidObjectId(err)) {
      return res.status(404).json({ message: "Wishlist item not found" });
    }
    return res
      .status(500)
      .json({ message: "Failed to remove wishlist item", error: String(err) });
  }
});

module.exports = router;
