import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";
import { AI_GATEWAY_URL, createLovableAiGatewayRunIdFetch } from "./ai-gateway.server";

const MATERIAL_IDS = ["plastic", "metal", "glass", "paper", "ewaste", "organic", "other"] as const;

const scanSchema = z.object({
  items: z.array(
    z.object({
      label: z.string(),
      material: z.enum(MATERIAL_IDS),
      count: z.number(),
      confidence: z.number(),
    }),
  ),
  primaryMaterial: z.enum(MATERIAL_IDS),
  contaminated: z.boolean(),
  estimatedKg: z.number(),
  advice: z.string(),
});

export type WasteAnalysis = z.infer<typeof scanSchema>;

const INSTRUCTIONS = `You identify household and commercial recyclables in photos for Remake, a recycling service in The Gambia.
List each distinct kind of item you can see (at most 6 entries), with a short plain-English label, its material category, an approximate count, and your confidence from 0 to 1.
Material categories: plastic (bottles, sachets, buckets, chairs), metal (cans, tins, scrap), glass (bottles, jars), paper (cardboard, newspapers, books), ewaste (phones, chargers, cables, small electronics), organic (food scraps, peels, garden waste), other (anything else or unclear).
primaryMaterial is the category making up most of the load. contaminated is true when recyclables are visibly mixed with food residue, liquids, or general rubbish so they would be rejected as-is.
estimatedKg is a rough weight estimate for everything visible (use 0 if nothing recyclable). advice is one short sentence on how to prepare the load for collection.
If the photo shows no waste at all, return an empty items list, primaryMaterial "other", estimatedKg 0, and say so in advice. Be honest about uncertainty: lower the confidence rather than guessing.`;

export async function analyzeWasteImage(imageDataUrl: string): Promise<WasteAnalysis> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("The waste scanner is not configured yet.");
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: AI_GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    instructions: INSTRUCTIONS,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Identify the recyclable materials in this photo." },
          { type: "image", image: new URL(imageDataUrl) },
        ],
      },
    ],
    output: Output.object({ schema: scanSchema }),
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  try {
    return await result.output;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && error.text) {
      try {
        return scanSchema.parse(JSON.parse(error.text));
      } catch {
        /* fall through */
      }
    }
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 429) throw new Error("The scanner is busy. Please try again in a minute.");
    if (status === 402) throw new Error("AI credits have run out for this workspace. Choose the material manually for now.");
    throw new Error("We couldn't analyse this photo. Choose the material manually instead.");
  }
}
