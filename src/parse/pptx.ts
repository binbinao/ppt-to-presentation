import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

export interface RawSlide {
  slide: number; // 1-based, aligned with PPT page numbers
  title: string;
  body: string[];
  notes: string;
}

const xmlParser = new XMLParser({
  // Preserve attribute keys with @_ prefix; keep single text nodes as strings.
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // Never coerce to numbers: slide ids, text, etc. stay strings.
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: false,
  // Decode XML entities (&amp; &#NNN; &#xHHHH;) into real characters.
  processEntities: true,
  // Treat a single repeated child as an array for uniform iteration.
  isArray: (name) => ["a:p", "a:r", "a:t", "p:sp"].includes(name),
});

type XmlNode = Record<string, unknown>;

function asArray(value: unknown): XmlNode[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value as XmlNode[];
  return [value as XmlNode];
}

// fast-xml-parser decodes only the five predefined entities (&amp; &lt; ...),
// not numeric character references. Decode &#NNN; and &#xHHHH; ourselves.
function decodeNumericEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)));
}

// Collect text of a run/paragraph subtree: concatenate all descendant a:t values.
function collectText(node: unknown): string {
  if (typeof node === "string") return decodeNumericEntities(node);
  if (typeof node !== "object" || node === null) return "";
  const obj = node as XmlNode;
  let text = "";
  for (const key of Object.keys(obj)) {
    if (key.startsWith("@_")) continue;
    if (key === "a:t") text += asArray(obj[key]).map((v) => (typeof v === "string" ? decodeNumericEntities(v) : "")).join("");
    else text += asArray(obj[key]).map(collectText).join("");
  }
  return text;
}

// Find shapes that carry a title placeholder; fall back to first shape with text.
function titleFromBodyShapes(shapes: XmlNode[]): { title: string; body: string[] } {
  const paragraphs = (sp: XmlNode): string[] =>
    asArray((sp["p:txBody"] as XmlNode | undefined)?.["a:p"]).map(collectText);

  let title = "";
  const body: string[] = [];
  const titleTexts: string[] = [];
  for (const sp of shapes) {
    const nvPr = (sp["p:nvSpPr"] as XmlNode | undefined)?.["p:nvPr"] as XmlNode | undefined;
    const ph = nvPr?.["p:ph"] as Record<string, unknown> | undefined;
    const isTitle = typeof ph === "object" && (ph["@_type"] === "title" || ph["@_type"] === "ctrTitle");
    const texts = paragraphs(sp);
    if (isTitle) {
      if (texts.length > 0) titleTexts.push(texts.join(" "));
    } else {
      body.push(...texts.filter((t) => t.length > 0));
    }
  }
  if (titleTexts.length > 0) {
    title = titleTexts.join(" ");
  } else if (body.length > 0) {
    // Fallback for decks without title placeholders: first shape's text is the
    // title (legacy heuristic, preserves old behavior).
    title = body.shift() ?? "";
  }
  return { title, body };
}

// Extract notes text (body of the notes slide), skipping page-number fields.
function extractNotesText(notesXml: string): string {
  const doc = xmlParser.parse(notesXml) as XmlNode;
  const spTree = ((doc["p:notes"] as XmlNode | undefined)?.["p:cSld"] as XmlNode | undefined)?.["p:spTree"];
  const shapes = asArray((spTree as XmlNode | undefined)?.["p:sp"]);
  const parts: string[] = [];
  for (const sp of shapes) {
    const nvPr = (sp["p:nvSpPr"] as XmlNode | undefined)?.["p:nvPr"] as XmlNode | undefined;
    const ph = nvPr?.["p:ph"] as Record<string, unknown> | undefined;
    // Skip slide-number / placeholder chrome; keep the notes body placeholder.
    if (ph && ph["@_type"] === "sldNum") continue;
    const texts = asArray((sp["p:txBody"] as XmlNode | undefined)?.["a:p"]).map(collectText);
    parts.push(...texts.filter((t) => t.length > 0));
  }
  return parts.join(" ").trim();
}

// Resolve slide order from presentation.xml's sldIdLst via presentation.xml.rels.
async function orderedSlidePaths(zip: JSZip): Promise<string[]> {
  const presFile = zip.file("ppt/presentation.xml");
  if (!presFile) throw new Error("invalid pptx: missing ppt/presentation.xml");
  const presXml = await presFile.async("string");
  const relsFile = zip.file("ppt/_rels/presentation.xml.rels");
  if (!relsFile) throw new Error("invalid pptx: missing ppt/_rels/presentation.xml.rels");
  const relsXml = await relsFile.async("string");

  const pres = xmlParser.parse(presXml) as XmlNode;
  const relDoc = xmlParser.parse(relsXml) as XmlNode;

  // r:id may live as @_r:id or @_id depending on namespace handling; accept both.
  const sldIdList = asArray(((pres["p:presentation"] as XmlNode)?.["p:sldIdLst"] as XmlNode)?.["p:sldId"]);
  const relMap = new Map<string, string>();
  for (const r of asArray(relDoc["Relationships"])) {
    for (const rel of asArray(r["Relationship"])) {
      const id = (rel["@_Id"] ?? rel["@_Id".toLowerCase()]) as string | undefined;
      const target = rel["@_Target"] as string | undefined;
      if (id && target) relMap.set(id, target);
    }
  }

  const order: string[] = [];
  for (const sldId of sldIdList) {
    const rid = (sldId["@_r:id"] ?? sldId["@_id"]) as string | undefined;
    if (!rid) throw new Error("invalid pptx: sldId without r:id in presentation.xml");
    const target = relMap.get(rid);
    if (!target) throw new Error(`invalid pptx: slide rel ${rid} not found in presentation.xml.rels`);
    order.push(target.replace(/^\//, "").startsWith("ppt/") ? target.replace(/^\//, "") : `ppt/${target.replace(/^\//, "")}`);
  }
  if (order.length === 0) throw new Error("invalid pptx: no slides in presentation.xml sldIdLst");
  return order;
}

// Find the notesSlide part for a slide via its rels; undefined when absent.
// Rel targets are relative to the slide part's directory (ppt/slides).
async function notesTargetForSlide(zip: JSZip, slidePath: string): Promise<string | undefined> {
  const relsPath = slidePath.replace("ppt/slides/", "ppt/slides/_rels/") + ".rels";
  const relsFile = zip.file(relsPath);
  if (!relsFile) return undefined;
  const relsXml = await relsFile.async("string");
  const doc = xmlParser.parse(relsXml) as XmlNode;
  for (const rel of asArray(doc["Relationships"] as XmlNode)?.flatMap((r) => asArray(r["Relationship"]))) {
    const type = (rel["@_Type"] as string | undefined) ?? "";
    if (!type.endsWith("/notesSlide")) continue;
    const target = rel["@_Target"] as string | undefined;
    if (!target) return undefined;
    // Resolve relative to the slide part's directory (handles ../ correctly).
    const dir = slidePath.replace(/\/[^/]+$/, "").split("/");
    const parts: string[] = [];
    for (const seg of target.replace(/^\//, "").split("/")) {
      if (seg === "..") dir.pop();
      else if (seg !== ".") parts.push(seg);
    }
    return [...dir, ...parts].join("/");
  }
  return undefined;
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
    const doc = xmlParser.parse(xml) as XmlNode;
    const spTree = ((doc["p:sld"] as XmlNode)?.["p:cSld"] as XmlNode)?.["p:spTree"] as XmlNode | undefined;
    const shapes = asArray(spTree?.["p:sp"]);

    // Title = title placeholder text (regardless of spTree order); body = other shapes.
    const { title, body } = titleFromBodyShapes(shapes);

    let notes = "";
    const notesPath = await notesTargetForSlide(zip, path);
    if (notesPath) {
      const notesFile = zip.file(notesPath);
      if (notesFile) notes = extractNotesText(await notesFile.async("string"));
    }

    slides.push({ slide: i + 1, title: title ?? "", body, notes });
  }
  return slides;
}
