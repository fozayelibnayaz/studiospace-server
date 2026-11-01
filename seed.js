/**
 * StudioSpace seed data — run with:  node seed.js
 *
 * 12 realistic, Bangladesh-based studios across the exact 5 platform
 * categories. Prices are in BDT (৳) and locations span Dhaka, Chattogram,
 * Sylhet, Cox's Bazar and Rajshahi.
 *
 * Owner email: seed@example.com  (sign up with it in the UI to edit them)
 */
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.DB_NAME || "studiospaceDB";
const OWNER_EMAIL = "seed@example.com";

const studios = [
  {
    title: "Gulshan Glasshouse Photo Studio",
    category: "Photo Studio",
    hourlyRate: 6500,
    securityDeposit: 15000,
    maxCapacity: 15,
    location: "House 48, Road 11, Gulshan 1, Dhaka 1212",
    image: "/studios/gulshan-glasshouse.jpg",
    amenities: [
      "Cyc Wall",
      "Lighting Kit",
      "4K Cameras",
      "Makeup Room",
      "Air Conditioning",
      "Wi-Fi",
      "Generator Backup",
    ],
    overview:
      "A daylight-balanced cyc studio in Gulshan 1 built for fashion lookbooks, e-commerce catalogues and portrait sittings. The 5.5-metre seamless cyclorama can be repainted in your brand colours on request, and the in-house Profoto heads mean you travel light. A dedicated makeup room keeps talent comfortable through back-to-back sessions, and the rooftop terrace is yours for golden-hour frames between 4 and 6pm.",
    ownerName: "Rafiq Chowdhury",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-rafiq",
    rating: 4.9,
    totalReviews: 48,
  },
  {
    title: "Dhanmondi Daylight Loft",
    category: "Photo Studio",
    hourlyRate: 4200,
    securityDeposit: 10000,
    maxCapacity: 8,
    location: "Road 27, Dhanmondi, Dhaka 1209",
    image: "/studios/dhanmondi-loft.jpg",
    amenities: [
      "Lighting Kit",
      "Wi-Fi",
      "Parking",
      "Makeup Room",
      "Air Conditioning",
    ],
    overview:
      "A cosy second-floor loft off Road 27 with a north-facing window wall that gives soft, even light through the Dhaka afternoon. Comes with two strobe kits, V-flats and a rolling backdrop library in seven colours. Ideal for personal branding shoots and editorial portraits when you want a lived-in, warm frame without a full production budget.",
    ownerName: "Shireen Akter",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-shireen",
    rating: 4.6,
    totalReviews: 32,
  },
  {
    title: "Banani Blackbox Film Stage",
    category: "Film Stage",
    hourlyRate: 18000,
    securityDeposit: 50000,
    maxCapacity: 40,
    location: "Plot 7, Road 11, Banani, Dhaka 1213",
    image: "/studios/banani-blackbox.jpg",
    amenities: [
      "Green Screen",
      "4K Cameras",
      "Lighting Kit",
      "Soundproof",
      "Air Conditioning",
      "Parking",
      "Crew Lounge",
      "Generator Backup",
    ],
    overview:
      "A 6,000 sq ft blacked-out soundstage in Banani with a full rigging grid, silent HVAC and a 12x9m green screen wall. Built for drama blocks, music videos and TVCs that cannot afford to lose a light to load-shedding — the 250 kVA generator keeps the set live. Street-level roller-door load-in, a crew lounge, wardrobe tents and two production offices are included.",
    ownerName: "Nusrat Jahan",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-nusrat",
    rating: 4.9,
    totalReviews: 55,
  },
  {
    title: "Chattogram Port Stage",
    category: "Film Stage",
    hourlyRate: 14500,
    securityDeposit: 35000,
    maxCapacity: 30,
    location: "GEC Circle, Khulshi, Chattogram 4000",
    image: "/studios/chattogram-stage.jpg",
    amenities: [
      "Lighting Kit",
      "4K Cameras",
      "Soundproof",
      "Wi-Fi",
      "Parking",
      "Air Conditioning",
    ],
    overview:
      "Chattogram's go-to stage for branded content and interview-driven commercials. The house rig covers a 10x6m performance area with the control station just off set, and the camera department supplies three bodies, sliders and a wireless video village. Ten minutes from Agrabad, with secure van parking for the whole crew.",
    ownerName: "Imran Kabir",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-imran",
    rating: 4.7,
    totalReviews: 27,
  },
  {
    title: "Uttara Podcast Booth",
    category: "Podcast Lounge",
    hourlyRate: 2200,
    securityDeposit: 6000,
    maxCapacity: 4,
    location: "Sector 7, Uttara, Dhaka 1230",
    image: "/studios/uttara-podcast.jpg",
    amenities: ["Soundproof", "Mixer", "Wi-Fi", "Air Conditioning"],
    overview:
      "An acoustically treated two-seat lounge tuned for dialogue-first Bangla and English shows. The Shure SM7B chain through a RØDECaster Pro is patched the moment you sit down, and multitrack stems are copied to your drive before you leave. A soft key-light wall makes the room camera-ready for video podcasts, with a second camera angle already framed.",
    ownerName: "Farhana Rahman",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-farhana",
    rating: 4.8,
    totalReviews: 73,
  },
  {
    title: "Sylhet Tea Garden Mic Room",
    category: "Podcast Lounge",
    hourlyRate: 1800,
    securityDeposit: 5000,
    maxCapacity: 6,
    location: "Zindabazar, Sylhet 3100",
    image: "/studios/sylhet-mic-room.jpg",
    amenities: [
      "Soundproof",
      "Mixer",
      "4K Cameras",
      "Wi-Fi",
      "Air Conditioning",
    ],
    overview:
      "A four-seat panel room in Zindabazar with a green-tea-garden view through the live window. Designed for conversations that need broadcast audio and 4K video at once — low-reflection walls, a quality monitoring chain and an engineer for the first hour. Popular with Sylhet's diaspora shows and university podcasts.",
    ownerName: "Mehjabin Noor",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-mehjabin",
    rating: 4.6,
    totalReviews: 39,
  },
  {
    title: "Lalmatia Mix Suite",
    category: "Music Suite",
    hourlyRate: 4800,
    securityDeposit: 12000,
    maxCapacity: 8,
    location: "Block D, Lalmatia, Dhaka 1207",
    image: "/studios/lalmatia-mix.jpg",
    amenities: ["Soundproof", "Mixer", "Wi-Fi", "Air Conditioning"],
    overview:
      "A mastering-grade mix room built around a large-format console and calibrated nearfields. Ideal for final mix passes, stem export and attended sessions with artists who want to hear the low end properly. The engineer-friendly layout keeps the sweet spot free while you ride a compressor, and reference playback runs on both monitors and a mono Auratone.",
    ownerName: "Arif Mahmud",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-arif",
    rating: 4.8,
    totalReviews: 36,
  },
  {
    title: "Old Dhaka Baul Room",
    category: "Music Suite",
    hourlyRate: 2600,
    securityDeposit: 8000,
    maxCapacity: 6,
    location: "Shakhari Bazar, Old Dhaka 1100",
    image: "/studios/old-dhaka-baul.jpg",
    amenities: ["Soundproof", "Mixer", "Wi-Fi", "Air Conditioning"],
    overview:
      "A warm floating-floor room in Shakhari Bazar with a harmonium, tabla set and baul percussion kept in-house. The treated live room records cleanly at full ensemble volume while the control room stays untouched between sessions. Book it for folk-fusion tracking, acoustic demos or a documentary score that needs the sound of the old city.",
    ownerName: "Rezaul Karim",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-rezaul",
    rating: 4.7,
    totalReviews: 51,
  },
  {
    title: "Mohammadpur Art Yard",
    category: "Art Workshop",
    hourlyRate: 1600,
    securityDeposit: 5000,
    maxCapacity: 18,
    location: "Block C, Mohammadpur, Dhaka 1207",
    image: "/studios/mohammadpur-art.jpg",
    amenities: ["Wi-Fi", "Air Conditioning", "Parking", "Crew Lounge"],
    overview:
      "A bright, washable-wall workshop that hosts weekend painting classes, ceramic glazing and zine camps. Easels, aprons and a solvent-safe station come with the room, and the skylit corner gives genuinely usable daylight through the winter. Tables can be arranged classroom-style or as one long communal bench.",
    ownerName: "Nadia Islam",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-nadia",
    rating: 4.5,
    totalReviews: 22,
  },
  {
    title: "Cox's Bazar Sea Light Studio",
    category: "Photo Studio",
    hourlyRate: 5500,
    securityDeposit: 12000,
    maxCapacity: 10,
    location: "Kolatoli, Cox's Bazar 4700",
    image: "/studios/coxsbazar-sea-light.jpg",
    amenities: [
      "Cyc Wall",
      "Lighting Kit",
      "Wi-Fi",
      "Air Conditioning",
      "Parking",
      "Generator Backup",
    ],
    overview:
      "A sea-facing studio two minutes from Kolatoli beach, with a 4-metre cyclorama and a wall of glass that turns the Bay of Bengal into your backdrop. Drone batteries charge on-site, sand mats keep the floor clean between beach and set, and the crew kitchen keeps tea coming through long shoot days.",
    ownerName: "Tanvir Hasan",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-tanvir",
    rating: 4.9,
    totalReviews: 61,
  },
  {
    title: "Khulshi Rehearsal Room",
    category: "Music Suite",
    hourlyRate: 3200,
    securityDeposit: 9000,
    maxCapacity: 12,
    location: "Khulshi, Chattogram 4225",
    image: "/studios/khulshi-rehearsal.jpg",
    amenities: [
      "Soundproof",
      "Mixer",
      "Wi-Fi",
      "Air Conditioning",
      "Parking",
    ],
    overview:
      "A band-ready rehearsal room in Khulshi with a floating floor, drum riser and backline basics — bass amp, guitar amp and a tuned upright. The treated live room holds a five-piece at performance volume without upsetting the neighbours, and the separate control room keeps mixer setups untouched between sessions.",
    ownerName: "Sadia Islam",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-sadia",
    rating: 4.6,
    totalReviews: 28,
  },
  {
    title: "Rajshahi Clay & Canvas",
    category: "Art Workshop",
    hourlyRate: 1400,
    securityDeposit: 4000,
    maxCapacity: 14,
    location: "Shaheb Bazar, Rajshahi 6100",
    image: "/studios/rajshahi-clay.jpg",
    amenities: ["Wi-Fi", "Parking", "Air Conditioning", "Crew Lounge"],
    overview:
      "A studio-lab for illustrators, printmakers and potters near Shaheb Bazar. Two pottery wheels, a small kiln and a framed printing bay are included with the room, and the north wall of glass gives steady light for life drawing. Great for weekend classes, zine days and gallery prep before a Rajshahi exhibition.",
    ownerName: "Ayesha Rahman",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-ayesha",
    rating: 4.4,
    totalReviews: 15,
  },
];

async function seed() {
  const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: false, deprecationErrors: true },
  });

  try {
    await client.connect();
    const db = client.db(dbName);
    const studiosCol = db.collection("studios");

    // Idempotent: replace previous seed data only.
    const previous = await studiosCol
      .find({ ownerEmail: OWNER_EMAIL }, { projection: { _id: 1 } })
      .toArray();
    const previousIds = previous.map((s) => String(s._id));

    await studiosCol.deleteMany({ ownerEmail: OWNER_EMAIL });

    // Bookings and wishlist rows point at studios by string id; drop the
    // orphaned ones so My Bookings never links to a room that no longer exists.
    if (previousIds.length) {
      await db.collection("bookings").deleteMany({ studioId: { $in: previousIds } });
      await db.collection("wishlist").deleteMany({ studioId: { $in: previousIds } });
    }

    const now = new Date();
    const docs = studios.map((s, i) => ({
      ...s,
      createdAt: new Date(now.getTime() - (studios.length - i) * 36e5),
    }));

    const result = await studiosCol.insertMany(docs);
    const total = await studiosCol.countDocuments({ ownerEmail: OWNER_EMAIL });

    console.log(
      `Seeded ${result.insertedCount} Bangladesh studios (${total} seed docs total) into ${dbName}.studios`
    );
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

seed();
