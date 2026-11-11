import JSZip from "jszip";

export interface RawSlide {
  slide: number; // 1-based, aligned with PPT page numbers
  title: string;
  body: string[];
  notes: string;
}

// Extract all <a:t> text runs from an XML string, in document order.
function extractTextRuns(xml: string): string[] {
  return [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1] ?? "");
}

// Resolve slide order from presentation.xml's sldIdLst via presentation.xml.rels.
async function orderedSlidePaths(zip: JSZip): Promise<string[]> {
  const presFile = zip.file("ppt/presentation.xml");
  if (!presFile) throw new Error("invalid pptx: missing ppt/presentation.xml");
  const presXml = await presFile.async("string");
  const relsFile = zip.file("ppt/_rels/presentation.xml.rels");
  if (!relsFile) throw new Error("invalid pptx: missing ppt/_rels/presentation.xml.rels");
  const relsXml = await relsFile.async("string");

  const relMap = new Map<string, string>();
  for (const m of relsXml.matchAll(/<Relationship [^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
    relMap.set(m[1] ?? "", m[2] ?? "");
  }

  const order: string[] = [];
  for (const m of presXml.matchAll(/<p:sldId [^>]*r:id="([^"]+)"/g)) {
    const target = relMap.get(m[1] ?? "");
    if (!target) throw new Error(`invalid pptx: slide rel ${m[1]} not found in presentation.xml.rels`);
    order.push(`ppt/${target.replace(/^\//, "")}`);
  }
  if (order.length === 0) throw new Error("invalid pptx: no slides in presentation.xml sldIdLst");
  return order;
}

// Find the notesSlide part for a slide via its rels; undefined when absent.
// Rel targets are relative to the slide part's directory (ppt/slides), so
// resolve ../ paths instead of naively prepending ppt/.
async function notesTargetForSlide(zip: JSZip, slidePath: string): Promise<string | undefined> {
  const relsPath = slidePath.replace("ppt/slides/", "ppt/slides/_rels/") + ".rels";
  const relsFile = zip.file(relsPath);
  if (!relsFile) return undefined;
  const relsXml = await relsFile.async("string");
  const m = relsXml.match(/<Relationship [^>]*Type="[^"]*\/notesSlide"[^>]*Target="([^"]+)"/);
  if (!m?.[1]) return undefined;
  const dir = slidePath.replace(/\/[^/]+$/, "").split("/");
  const parts: string[] = [];
  for (const seg of m[1].replace(/^\//, "").split("/")) {
    if (seg === "..") dir.pop();
    else if (seg !== ".") parts.push(seg);
  }
  return [...dir, ...parts].join("/");
}

export async function extractSlides(pptxBytes: Uint8Array): Promise<RawSlide[]> {
  const zip = await JSZip.loadAsync(pptxBytes);
  const slidePaths = await orderedSlidePaths(zip);

  const slides: RawSlide[] = [];
  for (let i = 0; i < slidePaths.length; i++) {
    const path = slidePaths[i]!;
    const file = zip.file(path);
    if (!file) throw new Error(`invalid pptx: missing slide part ${path}`);
    const xml = await file.async("string");
    const runs = extractTextRuns(xml);

    // Heuristic per spec: title = first text run (title placeholder precedes body
    // in spTree document order); remaining runs are body points.
    const [title, ...body] = runs;

    let notes = "";
    const notesPath = await notesTargetForSlide(zip, path);
    if (notesPath) {
      const notesFile = zip.file(notesPath);
      if (notesFile) notes = extractTextRuns(await notesFile.async("string")).join(" ").trim();
    }

    slides.push({ slide: i + 1, title: title ?? "", body, notes });
  }
  return slides;
}
