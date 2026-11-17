export type MaterialId = "plastic" | "metal" | "glass" | "paper" | "ewaste" | "organic";

export type PickupStatus = "scheduled" | "collected" | "batched" | "verified" | "rejected";

export interface Pickup {
  id: string;
  /** Value encoded in the pickup QR code. */
  code: string;
  ownerType: "resident" | "business";
  /** True for pickups belonging to the signed-in demo resident (Ebrima). */
  mine: boolean;
  customer: string;
  phone: string;
  address: string;
  area: string;
  material: MaterialId;
  bags: number;
  date: string; // yyyy-mm-dd
  slot: string;
  notes?: string | undefined;
  status: PickupStatus;
  collector: string;
  createdAt: string;
  weightKg?: number | undefined;
  receiptNo?: string | undefined;
  collectedAt?: string | undefined;
  batchId?: string | undefined;
  acceptedKg?: number | undefined;
  pointsPending?: number | undefined;
  pointsAwarded?: number | undefined;
  recurring?: boolean | undefined;
  /** Recurring frequency for business pickups. */
  frequency?: "Weekly" | "Fortnightly" | "Monthly" | undefined;
  rejectReason?: string | undefined;
  /** Collector recorded this while offline; not yet synced. */
  unsynced?: boolean | undefined;
  photoTaken?: boolean | undefined;
}

export type BatchStatus = "ready" | "in_transit" | "verified";

export interface Batch {
  id: string;
  code: string;
  material: MaterialId;
  pickupIds: string[];
  totalKg: number;
  processor: string;
  createdAt: string;
  status: BatchStatus;
  acceptedKg?: number | undefined;
  rejectedKg?: number | undefined;
  grade?: string | undefined;
  inspectionNote?: string | undefined;
  decision?: BatchDecision | undefined;
}

export type BatchDecision = "accepted" | "partial" | "rejected";

export type TxnType = "earned" | "pending" | "redeemed" | "forfeited";

export interface Txn {
  id: string;
  type: TxnType;
  amount: number;
  label: string;
  date: string;
}

export interface Reward {
  id: string;
  name: string;
  partner: string;
  category: "Airtime & Data" | "Household" | "Food" | "Education" | "Services";
  cost: number;
  valueGmd: number;
  stock: number;
}

export interface Redemption {
  id: string;
  rewardId: string;
  name: string;
  cost: number;
  date: string;
  voucher: string;
  status: "Issued" | "Delivered";
}

export interface ScanItem {
  label: string;
  material: MaterialId;
  count: number;
  confidence: number;
}

export interface ScanResult {
  id: string;
  items: ScanItem[];
  primaryMaterial: MaterialId;
  accepted: boolean;
  estimatedKg: number;
  createdAt: string;
}

export interface RemakeState {
  wallet: { available: number; pending: number };
  pickups: Pickup[];
  batches: Batch[];
  transactions: Txn[];
  redemptions: Redemption[];
  lastScan: ScanResult | null;
  /** The pickup the guided demo follows end-to-end. */
  demoPickupId: string | null;
  seq: number;
  collectorOffline: boolean;
  /** Demo workspace the user last chose (role key from nav). */
  activeWorkspace: string;
  readNotifications: string[];
  profile: { name: string; phone: string; address: string; area: string; smsAlerts: boolean; language: "English" | "Wolof" | "Mandinka" };
}
