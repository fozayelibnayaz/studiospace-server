const express = require("express");
const { ObjectId } = require("mongodb");
const { getCollection, isInvalidObjectId } = require("../lib/db");
const { verifyToken } = require("../middleware/verifyToken");

const router = express.Router();

/** Active statuses that make a slot unavailable. */
const BLOCKING_STATUSES = ["Pending", "Confirmed"];

/**
 * Challenge 2 — Double-booking prevention.
 * Two ranges overlap when: newStart < existingEnd AND newEnd > existingStart.
 * Times are compared as minutes since midnight, which works because the
 * booking date itself is part of the filter.
 */
function minutes(time) {
  const [h, m] = String(time).split(":").map((n) => parseInt(n, 10));
  if (!Number.isFinite(h)) return NaN;
  return h * 60 + (Number.isFinite(m) ? m : 0);
}

function slotsOverlap(startA, endA, startB, endB) {
  const sA = minutes(startA);
  const eA = minutes(endA);
  const sB = minutes(startB);
  const eB = minutes(endB);
  if ([sA, eA, sB, eB].some(Number.isNaN)) return true; // fail safe
  return sA < eB && eA > sB;
}

/* POST /bookings — JWT protected.
 * 1. Validates input and recomputes hours/cost server-side from the studio doc.
 * 2. Rejects overlapping active bookings with 409 + a clear message.
 * 3. Inserts with status "Pending". */
router.post("/", verifyToken, async (req, res) => {
  try {
    const body = req.body ?? {};
    const studioId = String(body.studioId ?? "");
    const date = String(body.date ?? "").trim();
    const startTime = String(body.startTime ?? "").trim();
    const endTime = String(body.endTime ?? "").trim();

    if (!ObjectId.isValid(studioId)) {
      return res.status(400).json({ message: "Invalid studio id" });
    }
    if (!date || !startTime || !endTime) {
      return res
        .status(400)
        .json({ message: "Date, start time and end time are required" });
    }

    const studios = await getCollection("studios");
    const bookings = await getCollection("bookings");
    const studio = await studios.findOne({ _id: new ObjectId(studioId) });

    if (!studio) {
      return res.status(404).json({ message: "Studio not found" });
    }

    // Owner cannot book their own studio.
    if (studio.ownerEmail === req.decoded.email) {
      return res
        .status(403)
        .json({ message: "You cannot book your own studio listing" });
    }

    // Double-booking prevention.
    const sameDay = await bookings
      .find({
        studioId,
        date,
        status: { $in: BLOCKING_STATUSES },
      })
      .toArray();

    const clash = sameDay.find((b) =>
      slotsOverlap(startTime, endTime, b.startTime, b.endTime)
    );

    if (clash) {
      return res.status(409).json({
        message: `This slot is already booked. Please choose another time. (Existing: ${clash.startTime}–${clash.endTime})`,
      });
    }

    const startM = minutes(startTime);
    const endM = minutes(endTime);
    if (!Number.isFinite(startM) || !Number.isFinite(endM) || endM <= startM) {
      return res.status(400).json({
        message: "End time must be later than start time",
      });
    }

    const totalHours = Number(((endM - startM) / 60).toFixed(2));
    const totalCost = Number((totalHours * studio.hourlyRate).toFixed(2));

    const doc = {
      studioId,
      studioTitle: studio.title,
      studioImage: studio.image,
      studioLocation: studio.location,
      ownerEmail: studio.ownerEmail,
      customerName: String(body.customerName ?? req.decoded.name ?? "").trim(),
      customerEmail: req.decoded.email,
      date,
      startTime,
      endTime,
      totalHours,
      totalCost,
      securityDeposit: Number(studio.securityDeposit) || 0,
      status: "Pending",
      createdAt: new Date(),
    };

    const result = await bookings.insertOne(doc);
    return res.status(201).json({
      success: true,
      message: "Booking confirmed as pending",
      insertedId: result.insertedId,
      booking: doc,
    });
  } catch (err) {
    if (isInvalidObjectId(err)) {
      return res.status(400).json({ message: "Invalid studio id" });
    }
    return res
      .status(500)
      .json({ message: "Failed to create booking", error: String(err) });
  }
});

/* GET /bookings?email= — JWT protected; token email must match query. */
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

    const bookings = await getCollection("bookings");
    const docs = await bookings
      .find({ customerEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json(docs);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to load bookings", error: String(err) });
  }
});

/* GET /bookings/owner?email= — JWT protected.
 * Host-side listing: every booking made against studios owned by the
 * token email (used by the Booking Requests management page). */
router.get("/owner", verifyToken, async (req, res) => {
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

    const bookings = await getCollection("bookings");
    const docs = await bookings
      .find({ ownerEmail: email })
      .sort({ createdAt: -1 })
      .toArray();
    return res.status(200).json(docs);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to load booking requests", error: String(err) });
  }
});

/* PATCH /bookings/:id/cancel — JWT protected.
 * Only the owner of the booking, and only while status is "Pending". */
router.patch("/:id/cancel", verifyToken, async (req, res) => {
  try {
    const bookings = await getCollection("bookings");
    const booking = await bookings.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (req.decoded.email !== booking.customerEmail) {
      return res
        .status(403)
        .json({ message: "Forbidden: you can only cancel your own bookings" });
    }
    if (booking.status !== "Pending") {
      return res.status(409).json({
        message: `Only pending bookings can be cancelled (current status: ${booking.status})`,
      });
    }

    await bookings.updateOne(
      { _id: booking._id },
      { $set: { status: "Cancelled", cancelledAt: new Date() } }
    );

    return res
      .status(200)
      .json({ success: true, message: "Booking cancelled" });
  } catch (err) {
    if (isInvalidObjectId(err)) {
      return res.status(404).json({ message: "Booking not found" });
    }
    return res
      .status(500)
      .json({ message: "Failed to cancel booking", error: String(err) });
  }
});

/* PATCH /bookings/:id/status — JWT protected, HOST-side.
 * The studio owner advances a booking's lifecycle after the customer books:
 *   Pending  → Confirmed   (host accepts the request, e.g. payment settled)
 *   Confirmed → Completed  (host marks the session as delivered)
 * Strict transitions: no skips, no owner-side cancellations (customers own
 * cancelling via /cancel), and 403 for anyone who is not the studio owner. */
const OWNER_TRANSITIONS = {
  Pending: ["Confirmed"],
  Confirmed: ["Completed"],
};

router.patch("/:id/status", verifyToken, async (req, res) => {
  try {
    const nextStatus = String(req.body?.status ?? "").trim();

    const bookings = await getCollection("bookings");
    const booking = await bookings.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (req.decoded.email !== booking.ownerEmail) {
      return res
        .status(403)
        .json({ message: "Forbidden: only the studio owner manages this booking" });
    }

    const allowed = OWNER_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(nextStatus)) {
      return res.status(409).json({
        message: `Invalid status change: a ${booking.status} booking can only move to ${
          allowed.length ? allowed.join(" or ") : "no further states"
        }`,
      });
    }

    await bookings.updateOne(
      { _id: booking._id },
      { $set: { status: nextStatus, updatedAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      message: `Booking ${nextStatus.toLowerCase()}`,
      status: nextStatus,
    });
  } catch (err) {
    if (isInvalidObjectId(err)) {
      return res.status(404).json({ message: "Booking not found" });
    }
    return res
      .status(500)
      .json({ message: "Failed to update booking status", error: String(err) });
  }
});

module.exports = router;
