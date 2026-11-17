import { format } from "date-fns";
import type { MaterialId } from "./types";
import plasticImg from "@/assets/cat-plastic.jpg";
import metalImg from "@/assets/cat-metal.jpg";
import glassImg from "@/assets/cat-glass.jpg";
import paperImg from "@/assets/cat-paper.jpg";
import ewasteImg from "@/assets/cat-ewaste.jpg";
import organicImg from "@/assets/cat-organic.jpg";

/** Today as yyyy-mm-dd in the browser's time zone. */
export const todayIso = () => format(new Date(), "yyyy-MM-dd");

export interface MaterialInfo {
  id: MaterialId;
  name: string;
  examples: string;
  image: string;
  /** Default rate; live rates come from the backend (state.rates). */
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

export const HUB_NAME = "Kanifing Recycling Hub";

/** Estimate used for CO₂e figures: kg CO₂e avoided per kg recycled (shown as an estimate in the UI). */
export const CO2_PER_KG = 1.5;
/** Estimate used for water figures: litres saved per kg recycled. */
export const WATER_L_PER_KG = 0.9;
