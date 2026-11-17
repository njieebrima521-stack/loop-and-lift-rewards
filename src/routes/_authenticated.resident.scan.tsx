import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, CheckCircle2, ImagePlus, Loader2, RotateCcw, ScanLine, Trash2, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";
import scanSample from "@/assets/scan-sample.jpg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Panel, Simulated } from "@/components/remake/ui";
import { useRemake } from "@/lib/remake/store";
import { errorMessage, pointsFor } from "@/lib/remake/logic";
import { MATERIAL_LIST, MATERIALS } from "@/lib/remake/data";
import { analyzeWaste } from "@/lib/remake/scan.functions";
import { fmtKg } from "@/lib/remake/format";
import type { ScanResult } from "@/lib/remake/types";

export const Route = createFileRoute("/_authenticated/resident/scan")({
  head: () => ({
    meta: [
      { title: "Waste Scanner — Remake" },
      { name: "description", content: "Photograph your waste to identify recyclable materials and estimate Green Coins." },
      { property: "og:title", content: "Waste Scanner — Remake" },
      { property: "og:description", content: "Identify recyclables instantly with the Remake waste scanner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScanPage,
});

/** Downscale a photo to a JPEG data URL so uploads stay small. */
async function toDataUrl(src: string): Promise<string> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();
  const scale = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

function ScanPage() {
  const { state, refresh } = useRemake();
  const analyze = useServerFn(analyzeWaste);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  // Show the last saved scan once it has loaded.
  useEffect(() => { if (!photo && !result && state.lastScan) setResult(state.lastScan); }, [state.lastScan, photo, result]);

  const runScan = async () => {
    if (!photo) { toast.error("Add a photo first"); return; }
    setScanning(true);
    try {
      const r = await analyze({ data: { imageDataUrl: await toDataUrl(photo) } });
      setResult(r);
      void refresh();
    } catch (e) {
      toast.error(errorMessage(e), { description: "You can still choose the material yourself below." });
    } finally {
      setScanning(false);
    }
  };

  const shown = result;
  const m = shown?.primaryMaterial ? MATERIALS[shown.primaryMaterial] : null;

  return (
    <div>
      <PageHeader eyebrow="Resident" title="Waste Scan" description="Photograph your waste to learn what it is, whether Remake accepts it, and how many Green Coins it could earn." actions={<Simulated label="AI estimate · indicative only" />} />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Panel title="1 · Add a photo" description="Use your camera or pick from your gallery. Photos are saved privately with your scan.">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink">
            {photo ? (
              <img src={photo} alt="Waste to scan" className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center text-ink-muted">
                <div className="text-center"><Camera className="mx-auto size-10" /><p className="mt-2 text-sm">No photo yet</p></div>
              </div>
            )}
            <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-dashed border-primary/80" />
            {scanning && <div className="absolute inset-x-8 top-1/2 h-0.5 animate-pulse bg-primary shadow-glow" />}
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPhoto(URL.createObjectURL(f)); setResult(null); } }} />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" size="icon" className="size-12 rounded-full" aria-label="Choose from gallery" onClick={() => fileRef.current?.click()}><ImagePlus /></Button>
            <Button size="icon" className="size-16 rounded-full" aria-label="Use sample photo" onClick={() => { setPhoto(scanSample); setResult(null); }}><Camera className="size-6" /></Button>
            <Button variant="outline" size="icon" className="size-12 rounded-full" aria-label="Remove photo" onClick={() => { setPhoto(null); setResult(null); }}><Trash2 /></Button>
          </div>
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Or choose the material yourself</p>
            <div className="flex flex-wrap gap-2">
              {MATERIAL_LIST.filter((x) => state.rates[x.id].active).map((x) => (
                <button key={x.id} onClick={() => navigate({ to: "/resident/pickups", search: { tab: "book", material: x.id } })} className="rounded-full border px-3 py-1.5 text-sm hover:bg-muted">{x.name}</button>
              ))}
            </div>
          </div>
          <Button className="mt-5 w-full" size="lg" onClick={runScan} disabled={scanning || !photo}>
            {scanning ? <><Loader2 className="animate-spin" /> Scanning…</> : <><ScanLine /> Scan waste</>}
          </Button>
        </Panel>

        <Panel title="2 · Result" description={shown ? `Scan ${shown.id}` : "Results appear here after scanning."}>
          {!shown ? (
            <div className="grid h-full min-h-64 place-items-center rounded-2xl border border-dashed bg-muted/40 text-center text-sm text-muted-foreground">
              <div><ScanLine className="mx-auto mb-2 size-8 text-primary" />Add a photo and press <b>Scan waste</b>.</div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className={`flex items-center gap-3 rounded-2xl p-4 ${shown.accepted ? "bg-primary text-primary-foreground" : "bg-danger-soft text-destructive"}`}>
                {shown.accepted ? <CheckCircle2 className="size-7" /> : <XCircle className="size-7" />}
                <div>
                  <p className="font-display text-lg font-semibold">{shown.accepted && m ? "Likely accepted" : "Not accepted as-is"}</p>
                  <p className="text-sm opacity-90">{shown.accepted && m ? `Mostly ${m.name.toLowerCase()} · about ${fmtKg(shown.estimatedKg)}` : shown.contaminated ? "Looks mixed with food or rubbish. Clean and separate, then scan again." : m ? `${m.name} isn't taken by a partner right now.` : "We couldn't spot recyclable material in this photo."}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 font-semibold">Details</p>
                <ul className="divide-y rounded-2xl border">
                  {shown.items.map((it) => (
                    <li key={it.label} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <span>{it.label}</span>
                      <span className="flex items-center gap-3"><Badge variant="muted">{it.material === "other" ? "Other" : MATERIALS[it.material].name} · {Math.round(it.confidence * 100)}%</Badge><b className="tabular">{it.count}</b></span>
                    </li>
                  ))}
                </ul>
              </div>
              {shown.advice && <p className="text-sm text-muted-foreground">{shown.advice}</p>}
              {shown.accepted && m && shown.primaryMaterial && (
                <p className="rounded-xl bg-mint p-3 text-sm text-mint-foreground">Estimated reward: <b>~{pointsFor(state.rates[shown.primaryMaterial].pointsPerKg, shown.estimatedKg)} Green Coins</b>, pending until a processor verifies the material. AI detection is an estimate — the collector's scale and the processor decide the final amount.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {shown.accepted && shown.primaryMaterial ? (
                  <Button size="lg" className="flex-1" onClick={() => navigate({ to: "/resident/pickups", search: { tab: "book", material: shown.primaryMaterial ?? undefined } })}><Truck /> Hand over the trash</Button>
                ) : (
                  <Button asChild size="lg" variant="ink" className="flex-1"><Link to="/resident/guide">Open recycling guide</Link></Button>
                )}
                <Button size="lg" variant="outline" onClick={() => { setResult(null); setPhoto(null); }}><RotateCcw /> Retake</Button>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
