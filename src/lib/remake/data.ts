import type { Batch, MaterialId, Pickup, RemakeState, Reward, Txn, Redemption } from "./types";
import plasticImg from "@/assets/cat-plastic.jpg";
import metalImg from "@/assets/cat-metal.jpg";
import glassImg from "@/assets/cat-glass.jpg";
import paperImg from "@/assets/cat-paper.jpg";
import ewasteImg from "@/assets/cat-ewaste.jpg";
import organicImg from "@/assets/cat-organic.jpg";

/** Fixed demo "today" so server and browser render the same dates. */
export const DEMO_TODAY = "2026-11-17";

export const RESIDENT = {
  name: "Ebrima Njie",
  phone: "+220 771 2345",
  address: "14 Kairaba Avenue, Pipeline",
  area: "Kanifing",
};

export interface MaterialInfo {
  id: MaterialId;
  name: string;
  examples: string;
  image: string;
  pointsPerKg: number;
  accepted: string[];
  notAccepted: string[];
  prep: string[];
}

export const MATERIALS: Record<MaterialId, MaterialInfo> = {
  plastic: {
    id: "plastic",
    name: "Plastics",
    examples: "Bottles, buckets, chairs, cups",
    image: plasticImg,
    pointsPerKg: 15,
    accepted: ["PET water & soft-drink bottles", "HDPE buckets and jerrycans", "Plastic chairs and crates", "Cups and food tubs (rinsed)"],
    notAccepted: ["Pure-water sachets with food residue", "Styrofoam", "Plastic mixed with metal parts"],
    prep: ["Empty and rinse containers", "Remove caps and keep them in the same bag", "Flatten bottles to save space", "Keep plastics dry and separate from food waste"],
  },
  metal: {
    id: "metal",
    name: "Metals",
    examples: "Cans, tables, gas containers",
    image: metalImg,
    pointsPerKg: 20,
    accepted: ["Aluminium drink cans", "Tin food cans", "Old metal tables and frames", "Empty, depressurised gas containers"],
    notAccepted: ["Cans with paint or oil residue", "Pressurised or leaking gas bottles"],
    prep: ["Rinse food cans", "Crush aluminium cans", "Ensure gas containers are fully empty and valve open", "Separate metal from wood or plastic parts"],
  },
  glass: {
    id: "glass",
    name: "Glass",
    examples: "Bottles, jars, mirrors",
    image: glassImg,
    pointsPerKg: 8,
    accepted: ["Clear and green bottles", "Food jars", "Intact mirrors (wrapped)"],
    notAccepted: ["Light bulbs", "Window glass", "Ceramic plates and cups"],
    prep: ["Remove lids and corks", "Rinse jars", "Wrap broken pieces in paper and label them", "Do not mix with ceramics"],
  },
  paper: {
    id: "paper",
    name: "Paper & Cardboard",
    examples: "Boxes, newspapers, exercise books",
    image: paperImg,
    pointsPerKg: 10,
    accepted: ["Cardboard boxes", "Newspapers and magazines", "Office paper and old exercise books"],
    notAccepted: ["Wet or greasy paper", "Paper cups with plastic lining", "Tissue paper"],
    prep: ["Flatten boxes", "Tie paper in bundles", "Keep dry — wet paper is rejected"],
  },
  ewaste: {
    id: "ewaste",
    name: "Electronic Waste",
    examples: "Phones, chargers, cables, radios",
    image: ewasteImg,
    pointsPerKg: 30,
    accepted: ["Mobile phones and tablets", "Chargers and cables", "Radios, small appliances", "Computer parts"],
    notAccepted: ["Leaking or swollen batteries", "Fridges (book a special collection)"],
    prep: ["Remove batteries and hand them over separately", "Erase personal data from phones", "Bundle cables together"],
  },
  organic: {
    id: "organic",
    name: "Organic Waste",
    examples: "Food scraps, peels, garden waste",
    image: organicImg,
    pointsPerKg: 5,
    accepted: ["Fruit and vegetable peels", "Coconut husks", "Garden leaves and grass"],
    notAccepted: ["Meat and bones", "Plastic bags with food", "Animal waste"],
    prep: ["Drain liquids", "Use a covered bucket", "Keep free of plastic and glass"],
  },
};

export const MATERIAL_LIST = Object.values(MATERIALS);

export const TIME_SLOTS = ["07:00 – 09:00", "09:00 – 11:00", "11:00 – 13:00", "14:00 – 16:00", "16:00 – 18:00"];

export const AREAS = ["Kanifing", "Serrekunda", "Bakau", "Banjul", "Brikama", "Brusubi", "Sukuta", "Kololi", "Lamin"];

export const COLLECTORS = ["Lamin Ceesay", "Fatou Jallow", "Omar Sanneh"];

export const PROCESSORS = ["Gambia Polymer Works", "Banjul Metal Recovery", "Brikama Compost Co-op"];

export const HUB_NAME = "Kanifing Recycling Hub";

export const REWARDS: Reward[] = [
  { id: "airtime-50", name: "Africell Airtime GMD 50", partner: "Africell", category: "Airtime & Data", cost: 500, valueGmd: 50, stock: 240 },
  { id: "data-2gb", name: "QCell 2GB Data Bundle", partner: "QCell", category: "Airtime & Data", cost: 900, valueGmd: 90, stock: 120 },
  { id: "cashpower-100", name: "NAWEC Cash Power GMD 100", partner: "NAWEC", category: "Services", cost: 1000, valueGmd: 100, stock: 80 },
  { id: "delivery", name: "Free Delivery Voucher", partner: "Gamjobs Express", category: "Services", cost: 1000, valueGmd: 100, stock: 60 },
  { id: "bag", name: "Reusable Shopping Bag", partner: "Remake Store", category: "Household", cost: 350, valueGmd: 35, stock: 300 },
  { id: "bin", name: "Household Sorting Bin", partner: "Remake Store", category: "Household", cost: 5000, valueGmd: 500, stock: 25 },
  { id: "rice", name: "Rice Bag 5kg", partner: "Kairaba Supermarket", category: "Food", cost: 3200, valueGmd: 320, stock: 40 },
  { id: "books", name: "School Exercise Books (10)", partner: "Timbooktoo", category: "Education", cost: 2200, valueGmd: 220, stock: 90 },
  { id: "dispenser", name: "Water Dispenser", partner: "Remake Store", category: "Household", cost: 10000, valueGmd: 1000, stock: 8 },
];

const seedPickups: Pickup[] = [
  // Ebrima's history
  { id: "PU-1042", code: "RMK-PU-1042", ownerType: "resident", mine: true, customer: RESIDENT.name, phone: RESIDENT.phone, address: RESIDENT.address, area: RESIDENT.area, material: "plastic", bags: 3, date: "2026-11-03", slot: "09:00 – 11:00", status: "verified", collector: "Lamin Ceesay", createdAt: "2026-11-01", weightKg: 12.4, receiptNo: "RC-88120", acceptedKg: 12, batchId: "BT-301", pointsAwarded: 180 },
  { id: "PU-1057", code: "RMK-PU-1057", ownerType: "resident", mine: true, customer: RESIDENT.name, phone: RESIDENT.phone, address: RESIDENT.address, area: RESIDENT.area, material: "metal", bags: 2, date: "2026-11-10", slot: "07:00 – 09:00", status: "verified", collector: "Lamin Ceesay", createdAt: "2026-11-08", weightKg: 8.5, receiptNo: "RC-88233", acceptedKg: 8.5, batchId: "BT-302", pointsAwarded: 170 },
  { id: "PU-1068", code: "RMK-PU-1068", ownerType: "resident", mine: true, customer: RESIDENT.name, phone: RESIDENT.phone, address: RESIDENT.address, area: RESIDENT.area, material: "paper", bags: 2, date: "2026-11-15", slot: "14:00 – 16:00", status: "collected", collector: "Fatou Jallow", createdAt: "2026-11-13", weightKg: 9, receiptNo: "RC-88410", pointsPending: 90 },
  // Other customers — collected, waiting at hub
  { id: "PU-1070", code: "RMK-PU-1070", ownerType: "resident", mine: false, customer: "Awa Touray", phone: "+220 390 1122", address: "Mosque Road", area: "Serrekunda", material: "plastic", bags: 4, date: "2026-11-16", slot: "09:00 – 11:00", status: "collected", collector: "Lamin Ceesay", createdAt: "2026-11-14", weightKg: 15.2, receiptNo: "RC-88441" },
  { id: "PU-1071", code: "RMK-PU-1071", ownerType: "business", mine: false, customer: "Kololi Sands Hotel", phone: "+220 446 5500", address: "Senegambia Strip", area: "Kololi", material: "plastic", bags: 12, date: "2026-11-16", slot: "07:00 – 09:00", status: "collected", collector: "Omar Sanneh", createdAt: "2026-11-14", weightKg: 48.6, receiptNo: "RC-88445", recurring: true },
  { id: "PU-1072", code: "RMK-PU-1072", ownerType: "resident", mine: false, customer: "Mariama Bojang", phone: "+220 702 8890", address: "Atlantic Road", area: "Bakau", material: "glass", bags: 2, date: "2026-11-16", slot: "11:00 – 13:00", status: "collected", collector: "Fatou Jallow", createdAt: "2026-11-15", weightKg: 11.8, receiptNo: "RC-88452" },
  // Today's scheduled route
  { id: "PU-1074", code: "RMK-PU-1074", ownerType: "resident", mine: false, customer: "Modou Camara", phone: "+220 365 7781", address: "Bertil Harding Hwy", area: "Kanifing", material: "metal", bags: 1, date: DEMO_TODAY, slot: "07:00 – 09:00", status: "scheduled", collector: "Lamin Ceesay", createdAt: "2026-11-15" },
  { id: "PU-1075", code: "RMK-PU-1075", ownerType: "business", mine: false, customer: "Westfield Pharmacy", phone: "+220 437 2211", address: "Westfield Junction", area: "Serrekunda", material: "paper", bags: 6, date: DEMO_TODAY, slot: "09:00 – 11:00", status: "scheduled", collector: "Lamin Ceesay", createdAt: "2026-11-15", recurring: true },
  { id: "PU-1076", code: "RMK-PU-1076", ownerType: "resident", mine: false, customer: "Isatou Faye", phone: "+220 781 4402", address: "Church Street", area: "Sukuta", material: "plastic", bags: 2, date: DEMO_TODAY, slot: "11:00 – 13:00", status: "scheduled", collector: "Lamin Ceesay", createdAt: "2026-11-16" },
  { id: "PU-1077", code: "RMK-PU-1077", ownerType: "business", mine: false, customer: "Kololi Sands Hotel", phone: "+220 446 5500", address: "Senegambia Strip", area: "Kololi", material: "glass", bags: 8, date: "2026-11-19", slot: "07:00 – 09:00", status: "scheduled", collector: "Omar Sanneh", createdAt: "2026-11-12", recurring: true },
];

const seedBatches: Batch[] = [
  { id: "BT-301", code: "RMK-BT-301", material: "plastic", pickupIds: ["PU-1042"], totalKg: 412, processor: "Gambia Polymer Works", createdAt: "2026-11-05", status: "verified", acceptedKg: 396, rejectedKg: 16, grade: "Grade A", decision: "partial" },
  { id: "BT-302", code: "RMK-BT-302", material: "metal", pickupIds: ["PU-1057"], totalKg: 268, processor: "Banjul Metal Recovery", createdAt: "2026-11-12", status: "verified", acceptedKg: 268, rejectedKg: 0, grade: "Grade A", decision: "accepted" },
  { id: "BT-305", code: "RMK-BT-305", material: "paper", pickupIds: [], totalKg: 186, processor: "Gambia Polymer Works", createdAt: "2026-11-16", status: "in_transit" },
];

const seedTxns: Txn[] = [
  { id: "T-9", type: "pending", amount: 90, label: "Paper pickup PU-1068 · awaiting verification", date: "2026-11-15" },
  { id: "T-8", type: "earned", amount: 170, label: "Metal pickup PU-1057 verified", date: "2026-11-13" },
  { id: "T-7", type: "redeemed", amount: -500, label: "Africell Airtime GMD 50", date: "2026-11-09" },
  { id: "T-6", type: "earned", amount: 180, label: "Plastic pickup PU-1042 verified", date: "2026-11-06" },
  { id: "T-5", type: "earned", amount: 240, label: "Community clean-up bonus · Bakau Beach", date: "2026-10-28" },
];

const seedRedemptions: Redemption[] = [
  { id: "RD-210", rewardId: "airtime-50", name: "Africell Airtime GMD 50", cost: 500, date: "2026-11-09", voucher: "AFR-7Q2K-91XD", status: "Delivered" },
  { id: "RD-184", rewardId: "bag", name: "Reusable Shopping Bag", cost: 350, date: "2026-10-12", voucher: "RMK-BAG-55TP", status: "Delivered" },
];

export function createSeedState(): RemakeState {
  return {
    wallet: { available: 2450, pending: 90 },
    pickups: seedPickups.map((p) => ({ ...p })),
    batches: seedBatches.map((b) => ({ ...b, pickupIds: [...b.pickupIds] })),
    transactions: seedTxns.map((t) => ({ ...t })),
    redemptions: seedRedemptions.map((r) => ({ ...r })),
    lastScan: null,
    demoPickupId: null,
    seq: 1100,
    collectorOffline: false,
    activeWorkspace: "resident",
    readNotifications: [],
    profile: { name: RESIDENT.name, phone: RESIDENT.phone, address: RESIDENT.address, area: RESIDENT.area, smsAlerts: true, language: "English" },
  };
}

/** Simulated, platform-wide figures for business & admin views. */
export const MONTHLY_TONNAGE = [
  { month: "Jun", plastic: 18.2, metal: 7.1, glass: 4.4, paper: 6.0, ewaste: 1.1 },
  { month: "Jul", plastic: 21.5, metal: 8.0, glass: 5.1, paper: 6.8, ewaste: 1.4 },
  { month: "Aug", plastic: 24.9, metal: 8.6, glass: 5.0, paper: 7.9, ewaste: 1.2 },
  { month: "Sep", plastic: 27.3, metal: 9.9, glass: 6.2, paper: 8.4, ewaste: 1.9 },
  { month: "Oct", plastic: 31.8, metal: 10.4, glass: 6.9, paper: 9.6, ewaste: 2.3 },
  { month: "Nov", plastic: 34.6, metal: 11.2, glass: 7.4, paper: 10.1, ewaste: 2.6 },
];
export const ACTIVE_COLLECTOR = "Lamin Ceesay";
export const BUSINESS = { name: "Kololi Sands Hotel", phone: "+220 446 5500", address: "Senegambia Strip", area: "Kololi" };
