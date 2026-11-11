import { z } from "zod";

const DeckInfo = z.object({
  title: z.string().min(1),
  slideCount: z.number().int().positive(),
});

export const OutlineSchema = z.object({
  deck: DeckInfo,
  slides: z
    .array(
      z.object({
        slide: z.number().int().positive(), // 1-based, aligned with PPT page numbers
        title: z.string(),
        body: z.array(z.string()),
        notes: z.string(),
        image: z.string(),
      }),
    )
    .min(1),
});

export const ScriptSchema = z.object({
  deck: DeckInfo,
  segments: z
    .array(
      z.object({
        slide: z.number().int().positive(),
        narration: z.string().min(1),
        durationSec: z.number().positive().optional(),
      }),
    )
    .min(1),
});

export type Outline = z.infer<typeof OutlineSchema>;
export type Script = z.infer<typeof ScriptSchema>;

function formatIssues(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

export function validateOutline(data: unknown): Outline {
  const result = OutlineSchema.safeParse(data);
  if (!result.success) throw new Error(`invalid outline.json — ${formatIssues(result.error)}`);
  return result.data;
}

export function validateScript(data: unknown): Script {
  const result = ScriptSchema.safeParse(data);
  if (!result.success) throw new Error(`invalid script.json — ${formatIssues(result.error)}`);
  return result.data;
}
