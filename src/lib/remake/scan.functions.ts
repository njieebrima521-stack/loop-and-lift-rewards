import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { analyzeWasteImage } from "./scan.server";

const MAX_DATA_URL = 7_500_000; // ~5.5 MB image

/**
 * Analyse a waste photo with Lovable AI and save the scan for the signed-in user.
 * Results are indicative only: a material counts as "accepted" only when it is an
 * active Remake material AND an active processor partner takes it AND it is not contaminated.
 */
export const analyzeWaste = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ imageDataUrl: z.string().max(MAX_DATA_URL).regex(/^data:image\/(png|jpe?g|webp|gif);base64,/) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const analysis = await analyzeWasteImage(data.imageDataUrl);

    const primary = analysis.primaryMaterial === "other" ? null : analysis.primaryMaterial;
    let accepted = false;
    if (primary && !analysis.contaminated && analysis.items.length > 0) {
      const [{ data: mat }, { data: partners }] = await Promise.all([
        supabase.from("materials").select("active").eq("id", primary).maybeSingle(),
        supabase.from("organizations").select("id").eq("kind", "processor").eq("status", "active").contains("materials", [primary]).limit(1),
      ]);
      accepted = !!mat?.active && (partners?.length ?? 0) > 0;
    }

    // Keep the photo with the scan record (private to the user).
    let imagePath: string | null = null;
    const match = /^data:(image\/[a-z]+);base64,(.*)$/s.exec(data.imageDataUrl);
    if (match) {
      const bytes = Uint8Array.from(atob(match[2]!), (c) => c.charCodeAt(0));
      const ext = match[1]!.split("/")[1]!.replace("jpeg", "jpg");
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("scan-images").upload(path, bytes, { contentType: match[1]! });
      if (!error) imagePath = path;
    }

    const items = analysis.items.slice(0, 6).map((i) => ({
      label: i.label.slice(0, 80),
      material: i.material,
      count: Math.max(0, Math.round(i.count)),
      confidence: Math.min(1, Math.max(0, i.confidence)),
    }));
    const { data: row, error } = await supabase
      .from("scans")
      .insert({
        user_id: userId,
        image_path: imagePath,
        items,
        primary_material: primary,
        accepted,
        contaminated: analysis.contaminated,
        estimated_kg: Math.max(0, Math.round(analysis.estimatedKg * 10) / 10),
        advice: analysis.advice.slice(0, 300),
        source: "ai",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return {
      id: row.id,
      items,
      primaryMaterial: primary,
      accepted,
      contaminated: analysis.contaminated,
      estimatedKg: Number(row.estimated_kg),
      advice: row.advice ?? undefined,
      createdAt: row.created_at.slice(0, 10),
    };
  });
