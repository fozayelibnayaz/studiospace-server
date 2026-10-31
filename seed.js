/**
 * StudioSpace seed data — run with:  node seed.js
 *
 * Inserts 12 realistic studios across the exact 5 platform categories
 * with real city locations and verified Unsplash studio imagery.
 * Owner email: seed@example.com  (use it to sign up in the UI and edit them)
 */
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.DB_NAME || "studiospaceDB";
const OWNER_EMAIL = "seed@example.com";

const img = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

const studios = [
  {
    title: "Aperture Bay Photo Studio",
    category: "Photo Studio",
    hourlyRate: 65,
    securityDeposit: 150,
    maxCapacity: 12,
    location: "House 34, Road 12, Banani, Dhaka 1213",
    image: img("1516035069371-29a1b244cc32"),
    amenities: ["Cyc Wall", "Lighting Kit", "4K Cameras", "Makeup Room", "Air Conditioning", "Wi-Fi"],
    overview:
      "A daylight-balanced cyc studio in the heart of Banani purpose-built for fashion lookbooks, product shots and portrait sittings. The 6-metre seamless cyclorama can be repainted in key colours on request, and the in-house Profoto heads plus modifiers mean you travel light. A dedicated makeup room with natural light keeps talent comfortable through back-to-back sessions.",
    ownerName: "Rafiq Chowdhury",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-rafiq",
    rating: 4.9,
    totalReviews: 48,
  },
  {
    title: "Northlight Portrait Loft",
    category: "Photo Studio",
    hourlyRate: 40,
    securityDeposit: 100,
    maxCapacity: 8,
    location: "Avenue 5, Sector 7, Uttara, Dhaka 1230",
    image: img("1471341971476-ae15ff5dd4ea"),
    amenities: ["Lighting Kit", "Wi-Fi", "Parking", "Makeup Room", "Air Conditioning"],
    overview:
      "A cosy second-floor loft with a north-facing window wall that gives soft, even light for portraits and personal branding shoots. Comes with two strobe kits, V-flats and a rolling backdrop library of seven colours. Perfect for creators who want an editorial feel without a big-studio budget.",
    ownerName: "Shireen Akter",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-shireen",
    rating: 4.7,
    totalReviews: 32,
  },
  {
    title: "FrameGold Production House",
    category: "Photo Studio",
    hourlyRate: 85,
    securityDeposit: 250,
    maxCapacity: 20,
    location: "Level 5, Gulshan Tower, Road 41, Gulshan, Dhaka 1212",
    image: img("1542038784456-1ea8e935640e"),
    amenities: ["Cyc Wall", "Green Screen", "4K Cameras", "Lighting Kit", "Soundproof", "Air Conditioning", "Parking"],
    overview:
      "A multi-zone production floor trusted by Dhaka's leading agencies for campaigns and commercials. Reserve the cyclorama zone, a green screen bay with 4K capture, or the tabletop setup for glassware and liquids — all on the same booking. On-site technicians are available at an hourly add-on.",
    ownerName: "Tanvir Hasan",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-tanvir",
    rating: 4.8,
    totalReviews: 61,
  },
  {
    title: "Silver Screen Soundstage",
    category: "Film Stage",
    hourlyRate: 120,
    securityDeposit: 400,
    maxCapacity: 30,
    location: "Plot 8, Tejgaon Industrial Area, Dhaka 1208",
    image: img("1485846234645-a62644f84728"),
    amenities: ["Green Screen", "4K Cameras", "Lighting Kit", "Soundproof", "Air Conditioning", "Parking"],
    overview:
      "A 4,000 sq ft blacked-out soundstage with rigging grid, silent HVAC and a 12x9m green screen wall. Built for drama blocks, music videos and TVCs. Load-in is street-level through a roller door, and the crew lounge doubles as a wardrobe with changing tents.",
    ownerName: "Nusrat Jahan",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-nusrat",
    rating: 4.9,
    totalReviews: 55,
  },
  {
    title: "Spotlight Stage One",
    category: "Film Stage",
    hourlyRate: 95,
    securityDeposit: 300,
    maxCapacity: 25,
    location: "GEC Circle, Khulshi, Chattogram 4000",
    image: img("1526170375885-4d8ecf77b99f"),
    amenities: ["Lighting Kit", "4K Cameras", "Soundproof", "Wi-Fi", "Parking", "Air Conditioning"],
    overview:
      "Chattogram's go-to stage for branded content and interview-driven commercials. The staple lighting rig covers a 10x6m performance area with a control station just off set. Includes camera department basics: three bodies, sliders, and a wireless video village.",
    ownerName: "Imran Kabir",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-imran",
    rating: 4.6,
    totalReviews: 27,
  },
  {
    title: "Little Berlin Filmbühne",
    category: "Film Stage",
    hourlyRate: 140,
    securityDeposit: 450,
    maxCapacity: 35,
    location: "Revaler Str. 40, Friedrichshain, Berlin 10245",
    image: img("1505373877841-8d25f7d46678"),
    amenities: ["Green Screen", "Cyc Wall", "Lighting Kit", "Soundproof", "Wi-Fi", "Parking"],
    overview:
      "A converted warehouse stage with a variable lighting grid and a restored theatre rig, five minutes from Ostkreuz. Favoured by European indie productions for its generous natural shadow control and pre-lit stand options. German or English-speaking gaffers can be booked with your slot.",
    ownerName: "Lena Mortensen",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-lena",
    rating: 4.8,
    totalReviews: 44,
  },
  {
    title: "Echo Chamber Podcast Lounge",
    category: "Podcast Lounge",
    hourlyRate: 45,
    securityDeposit: 120,
    maxCapacity: 6,
    location: "Road 27, Dhanmondi, Dhaka 1209",
    image: img("1478737270239-2f02b77fc618"),
    amenities: ["Soundproof", "Mixer", "Wi-Fi", "Air Conditioning"],
    overview:
      "Acoustically treated two-seat lounge tuned for dialogue-first shows. The Shure SM7B chain through a RØDECaster Pro is ready the moment you sit down, and multitrack stems are delivered to your drive before you leave. A wall of soft light makes the room camera-ready for video podcasts.",
    ownerName: "Farhana Rahman",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-farhana",
    rating: 4.9,
    totalReviews: 73,
  },
  {
    title: "Merlion Audio Den",
    category: "Podcast Lounge",
    hourlyRate: 55,
    securityDeposit: 150,
    maxCapacity: 10,
    location: "Tier 4, Gerald Lane, Boat Quay, Singapore 049715",
    image: img("1519677100203-a0e668c92439"),
    amenities: ["Soundproof", "Mixer", "4K Cameras", "Wi-Fi", "Air Conditioning"],
    overview:
      "A four-seat panel room overlooking the Singapore river, designed for conversations that need both broadcast audio and 4K video. Sticky, low-reflection walls plus a quality monitoring chain mean zero surprises at edit time. Book by the hour; first hour includes engineer setup.",
    ownerName: "Kenji Wee",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-kenji",
    rating: 4.7,
    totalReviews: 39,
  },
  {
    title: "Crescent Keys Music Suite",
    category: "Music Suite",
    hourlyRate: 50,
    securityDeposit: 130,
    maxCapacity: 10,
    location: "House 61, Road 9, Niketan, Gulshan, Dhaka 1212",
    image: img("1505740420928-5e560c06d30e"),
    amenities: ["Soundproof", "Mixer", "Wi-Fi", "Air Conditioning", "Parking"],
    overview:
      "A warm, floating-floor rehearsal and tracking room with a Yamaha upright, a drum riser and backline basics. The treated live room records cleanly at band volume, and the separate control room keeps mixer setups untouched between sessions.",
    ownerName: "Arif Mahmud",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-arif",
    rating: 4.6,
    totalReviews: 51,
  },
  {
    title: "Lisbon Sunset Mixing Studio",
    category: "Music Suite",
    hourlyRate: 70,
    securityDeposit: 200,
    maxCapacity: 6,
    location: "Rua da Rosa 172, Bairro Alto, Lisbon 1200-387",
    image: img("1598488035139-bdbb2231ce04"),
    amenities: ["Soundproof", "Mixer", "Wi-Fi", "Air Conditioning"],
    overview:
      "A mastering-grade mix room in Bairro Alto built around a large-format console and calibrated mains. Ideal for final mix passes, stems export and remote attended sessions. The engineer-friendly layout means you can adjust a compressor without leaving the sweet spot.",
    ownerName: "Sofia Andrade",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-sofia",
    rating: 4.8,
    totalReviews: 36,
  },
  {
    title: "Prism Palette Art Workshop",
    category: "Art Workshop",
    hourlyRate: 30,
    securityDeposit: 80,
    maxCapacity: 16,
    location: "House 12, Road 5, Block C, Mohammadpur, Dhaka 1207",
    image: img("1513364776144-60967b0f800f"),
    amenities: ["Wi-Fi", "Air Conditioning", "Parking", "Makeup Room"],
    overview:
      "A bright, washable-wall workshop that hosts weekend painting classes, ceramic glazing and craft camps. Easels, aprons and a solvent-safe station are included, and a skylighted corner gives genuinely usable daylight during winter months.",
    ownerName: "Nadia Islam",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-nadia",
    rating: 4.5,
    totalReviews: 22,
  },
  {
    title: "Riverfront Riso & Canvas Lab",
    category: "Art Workshop",
    hourlyRate: 38,
    securityDeposit: 90,
    maxCapacity: 14,
    location: "Agrabad Commercial Area, Chattogram 4100",
    image: img("1460661419201-fd4cecdf8a8b"),
    amenities: ["Wi-Fi", "Parking", "Air Conditioning"],
    overview:
      "A studio-lab for illustrators and riso printmakers beside the Karnaphuli riverfront. The lab runs a two-drum riso in six colour profiles, and a framed printing bay for canvas tests. Great for zine days, gallery prep and one-off poster runs.",
    ownerName: "Rezaul Karim",
    ownerEmail: OWNER_EMAIL,
    ownerPhoto: "https://i.pravatar.cc/150?u=seed-rezaul",
    rating: 4.2,
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
    await studiosCol.deleteMany({ ownerEmail: OWNER_EMAIL });
    const now = new Date();
    const docs = studios.map((s, i) => ({
      ...s,
      createdAt: new Date(now.getTime() - (studios.length - i) * 36e5),
    }));

    const result = await studiosCol.insertMany(docs);
    const total = await studiosCol.countDocuments({ ownerEmail: OWNER_EMAIL });

    console.log(
      `Seeded ${result.insertedCount} studios (${total} seed docs total) into ${dbName}.studios`
    );
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

seed();
