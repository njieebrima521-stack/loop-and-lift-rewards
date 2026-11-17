import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { createSeedState } from "./data";
import * as L from "./logic";
import type { RemakeState, Reward, ScanResult } from "./types";

type Action =
  | { type: "hydrate"; state: RemakeState }
  | { type: "set"; state: RemakeState }
  | { type: "reset" };

function reducer(state: RemakeState, action: Action): RemakeState {
  switch (action.type) {
    case "hydrate":
    case "set":
      return action.state;
    case "reset":
      return createSeedState();
  }
}

const KEY = "remake-demo-state-v2";

interface Ctx {
  state: RemakeState;
  saveScan: (scan: ScanResult) => void;
  bookPickup: (input: L.BookInput) => string;
  recordWeight: (pickupId: string, kg: number) => void;
  createBatch: (pickupIds: string[], processor: string) => string | null;
  handOverBatch: (batchId: string) => void;
  verifyBatch: (batchId: string, accepted: number, rejected: number, grade: string, note?: string) => void;
  redeem: (reward: Reward) => L.RedeemResult;
  rejectPickup: (pickupId: string, reason: string) => void;
  setOffline: (offline: boolean) => void;
  sync: () => void;
  markPhoto: (pickupId: string) => void;
  setWorkspace: (key: string) => void;
  markNotificationsRead: (ids: string[]) => void;
  updateProfile: (p: Partial<RemakeState["profile"]>) => void;
  reset: () => void;
}

const RemakeContext = createContext<Ctx | null>(null);

export function RemakeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createSeedState);
  const ref = useRef(state);
  ref.current = state;
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) dispatch({ type: "hydrate", state: { ...createSeedState(), ...(JSON.parse(raw) as RemakeState) } });
    } catch {
      /* ignore corrupt demo state */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state]);

  const apply = useCallback((next: RemakeState) => {
    ref.current = next;
    dispatch({ type: "set", state: next });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      saveScan: (scan) => apply(L.saveScan(ref.current, scan)),
      bookPickup: (input) => {
        const next = L.bookPickup(ref.current, input);
        apply(next);
        return next.demoPickupId!;
      },
      recordWeight: (id, kg) => apply(L.recordWeight(ref.current, id, kg)),
      createBatch: (ids, processor) => {
        const next = L.createBatch(ref.current, ids, processor);
        if (next === ref.current) return null;
        apply(next);
        return next.batches[0]!.id;
      },
      handOverBatch: (id) => apply(L.handOverBatch(ref.current, id)),
      verifyBatch: (id, a, r, g, n) => apply(L.verifyBatch(ref.current, id, a, r, g, n)),
      redeem: (reward) => {
        const res = L.redeemReward(ref.current, reward);
        if (res.ok) apply(res.state);
        return res;
      },
      rejectPickup: (id, reason) => apply(L.rejectPickup(ref.current, id, reason)),
      setOffline: (o) => apply(L.setCollectorOffline(ref.current, o)),
      sync: () => apply(L.syncCollector(ref.current)),
      setWorkspace: (key) => { if (ref.current.activeWorkspace !== key) apply({ ...ref.current, activeWorkspace: key }); },
      markPhoto: (id) => apply(L.markPhoto(ref.current, id)),
      markNotificationsRead: (ids) => apply({ ...ref.current, readNotifications: Array.from(new Set([...ref.current.readNotifications, ...ids])) }),
      updateProfile: (p) => apply({ ...ref.current, profile: { ...ref.current.profile, ...p } }),
      reset: () => {
        try {
          window.localStorage.removeItem(KEY);
        } catch {
          /* noop */
        }
        dispatch({ type: "reset" });
      },
    }),
    [state, apply],
  );

  return <RemakeContext.Provider value={value}>{children}</RemakeContext.Provider>;
}

export function useRemake() {
  const ctx = useContext(RemakeContext);
  if (!ctx) throw new Error("useRemake must be used inside RemakeProvider");
  return ctx;
}
