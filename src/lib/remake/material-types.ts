import type { MaterialId } from "./types";

/**
 * Fine-grained material types used for institution specialisations, routing and scanner results.
 * Each maps to a coarse `MaterialId` that carries the Green Coins rate and batch stream.
 * Mirrors the `material_types` table; the backend is the source of truth for permissions.
 */
export type MaterialTypeId =
  | "plastic_general" | "pet" | "hdpe" | "metal_other" | "aluminium"
  | "glass" | "paper" | "cardboard" | "ewaste" | "organic";

export interface MaterialTypeInfo {
  id: MaterialTypeId;
  name: string;
  parent: MaterialId;
}

export const MATERIAL_TYPES: MaterialTypeInfo[] = [
  { id: "plastic_general", name: "General plastics", parent: "plastic" },
  { id: "pet", name: "PET plastic bottles", parent: "plastic" },
  { id: "hdpe", name: "HDPE plastics", parent: "plastic" },
  { id: "metal_other", name: "Metals", parent: "metal" },
  { id: "aluminium", name: "Aluminium cans", parent: "metal" },
  { id: "glass", name: "Glass", parent: "glass" },
  { id: "paper", name: "Paper", parent: "paper" },
  { id: "cardboard", name: "Cardboard", parent: "paper" },
  { id: "ewaste", name: "Electronic waste", parent: "ewaste" },
  { id: "organic", name: "Organic waste", parent: "organic" },
];

export const materialTypeById = (id: string) => MATERIAL_TYPES.find((m) => m.id === id);
export const materialTypeName = (id: string) => materialTypeById(id)?.name ?? id;

/** Categories a resident picks in the booking wizard; each books one separate material stream. */
export interface BookingCategory {
  id: string;
  name: string;
  /** Material type the stream is booked and routed as. */
  type: MaterialTypeId;
  hint: string;
}

export const BOOKING_CATEGORIES: BookingCategory[] = [
  { id: "plastics", name: "Plastics", type: "plastic_general", hint: "Buckets, chairs, tubs, mixed hard plastic" },
  { id: "pet", name: "PET plastic bottles", type: "pet", hint: "Water and soft-drink bottles" },
  { id: "metals", name: "Metals", type: "metal_other", hint: "Cans, tins, metal frames" },
  { id: "glass", name: "Glass", type: "glass", hint: "Bottles and jars" },
  { id: "paper", name: "Paper & cardboard", type: "cardboard", hint: "Boxes, newspapers, books" },
  { id: "ewaste", name: "Electronic waste", type: "ewaste", hint: "Phones, chargers, small appliances" },
  { id: "organic", name: "Organic waste", type: "organic", hint: "Food scraps, garden waste" },
];

/** Scanner categories the AI may return (superset of material types plus "other"). */
export type ScanCategory = MaterialTypeId | "other";
