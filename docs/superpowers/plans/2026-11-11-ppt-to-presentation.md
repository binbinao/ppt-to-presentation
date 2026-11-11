# ppt-to-presentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a superpowers skill that converts a .pptx deck into a narrated presentation video via a 4-step pipeline (parse → draft → review → render).

**Architecture:** Bun-only TypeScript CLI. Steps communicate exclusively through JSON files (`build/outline.json`, `build/script.json`) validated by shared Zod schemas. LLM work (drafting, reviewing narration) happens in conversation per SKILL.md; scripts handle extraction, validation, TTS, and Remotion rendering.

**Tech Stack:** Bun 1.4+, TypeScript strict, Zod, JSZip (pptx parsing), edge-tts CLI (TTS), Remotion (video), LibreOffice + poppler (slide images).

**Spec:** `docs/superpowers/specs/2026-11-11-ppt-to-presentation-design.md`

## Global Constraints

- Runtime: Bun only (`bun run` / `bun test` / `bunx`); no npm/yarn lockfiles, no tsx/ts-node.
- TypeScript strict mode, no `any` at module boundaries.
- Slide/page indexes are 1-based, aligned with PPT page numbers everywhere.
- `script.json` segments MUST align to slides via the `slide` field — never array order.
- Predictable errors throw `Error` with page-number context; no logging in library code.
- JSON intermediates live under `build/`; final video under `output/`.
- External CLIs (`soffice`, `pdftoppm`, `edge-tts`) are invoked via `Bun.$`; environment check must precede pipeline steps.

---

### Task 1: Project scaffold + shared Zod schema

**Files:**
- Create: `package.json`, `tsconfig.json`
- Create: `src/schema.ts`
- Test: `tests/schema.test.ts`

**Interfaces:**
- Produces: `OutlineSchema`, `ScriptSchema` (Zod objects); `Outline`, `Script` (inferred types); `validateOutline(data: unknown): Outline`, `validateScript(data: unknown): Script` — throwing `Error` with a readable message on invalid input. All later tasks consume these.

- [ ] **Step 1: Initialize project files**

`package.json`:

```json
{
  "name": "ppt-to-presentation",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "parse": "bun run src/parse/index.ts",
    "draft": "bun run src/draft/index.ts",
    "review": "bun run src/review/index.ts",
    "render": "bun run src/render/index.ts",
    "test": "bun test"
  },
  "dependencies": {
    "jszip": "^3.10.1",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/bun": "^1.2.0",
    "typescript": "^5.6.0"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "types": ["bun-types"],
    "skipLibCheck": true
  },
  "include": ["src", "tests"]
}
```

Then run `bun install`.

- [ ] **Step 2: Write the failing test**

`tests/schema.test.ts`:

```typescript
import { describe, test, expect } from "bun:test";
import { validateOutline, validateScript } from "../src/schema";

const validOutline = {
  deck: { title: "Demo Deck", slideCount: 2 },
  slides: [
    { slide: 1, title: "Intro", body: ["point a"], notes: "hello", image: "build/slides/slide-1.png" },
    { slide: 2, title: "End", body: [], notes: "", image: "build/slides/slide-2.png" },
  ],
};

const validScript = {
  deck: { title: "Demo Deck", slideCount: 2 },
  segments: [
    { slide: 1, narration: "Welcome to the demo." },
    { slide: 2, narration: "Thanks for watching.", durationSec: 4.2 },
  ],
};

describe("schema", () => {
  test("accepts a valid outline", () => {
    expect(validateOutline(validOutline)).toEqual(validOutline);
  });

  test("rejects outline with 0-based slide numbers", () => {
    const bad = { ...validOutline, slides: [{ ...validOutline.slides[0], slide: 0 }] };
    expect(() => validateOutline(bad)).toThrow(/slide/);
  });

  test("accepts a valid script with durationSec", () => {
    expect(validateScript(validScript)).toEqual(validScript);
  });

  test("rejects script with negative durationSec", () => {
    const bad = { ...validScript, segments: [{ ...validScript.segments[0], durationSec: -1 }] };
    expect(() => validateScript(bad)).toThrow(/durationSec/);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `bun test tests/schema.test.ts`
Expected: FAIL — cannot resolve `../src/schema`.

- [ ] **Step 4: Write minimal implementation**

`src/schema.ts`:

```typescript
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun test tests/schema.test.ts`
Expected: 4 pass.

- [ ] **Step 6: Commit**

```bash
git add package.json bun.lockb tsconfig.json src/schema.ts tests/schema.test.ts
git commit -m "feat: scaffold project with shared outline/script Zod schemas"
```

---

### Task 2: parse — pptx → outline.json + slide images

**Files:**
- Create: `src/parse/pptx.ts`, `src/parse/slides.ts`, `src/parse/index.ts`
- Test: `tests/parse.test.ts`
- Create: `fixtures/` (generated sample pptx, see Step 2)

**Interfaces:**
- Consumes: `validateOutline` from Task 1.
- Produces: `extractSlides(pptxBytes: Uint8Array): Promise<RawSlide[]>` where `RawSlide = { slide: number; title: string; body: string[]; notes: string }`; `renderSlideImages(deckPath: string, outDir: string): Promise<string[]>` returning image paths in slide order; CLI entry `bun run parse <deck.pptx>` writes `build/outline.json` and `build/slides/slide-N.png`.

- [ ] **Step 1: Generate a minimal pptx fixture with Bun + JSZip**

`fixtures/make-fixture.ts`:

```typescript
import { writeFileSync } from "node:fs";
import JSZip from "jszip";

const slideXml = (title: string, body: string) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld><p:spTree>
    <p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:p><a:r><a:t>${title}</a:t></a:r></a:p></p:txBody></p:sp>
    <p:sp><p:nvSpPr><p:cNvPr id="3" name="Content"/><p:cNvSpPr/></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:p><a:r><a:t>${body}</a:t></a:r></a:p></p:txBody></p:sp>
  </p:spTree></p:cSld>
</p:sld>`;

const notesXml = (text: string) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:notes xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld><p:spTree><p:sp><p:nvSpPr><p:cNvPr id="2" name="Notes"/><p:cNvSpPr/></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:p><a:r><a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld>
</p:notes>`;

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/notesSlides/notesSlide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>
  <Override PartName="/ppt/notesSlides/notesSlide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>
</Types>`;

const rels = (target: string, id = "rId1", type = "slide") => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${target}"/>
</Relationships>`;

const zip = new JSZip();
zip.file("[Content_Types].xml", contentTypes);
zip.file("_rels/.rels", rels("ppt/presentation.xml", "rId1", "officeDocument"));
zip.file("ppt/presentation.xml", `<?xml version="1.0"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldIdLst><p:sldId id="1" r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><p:sldId id="2" r:id="rId2" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/></p:sldIdLst></p:presentation>`);
zip.file("ppt/_rels/presentation.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>
</Relationships>`);
zip.file("ppt/slides/slide1.xml", slideXml("Project Overview", "Convert PPT to video"));
zip.file("ppt/slides/slide2.xml", slideXml("Pipeline", "parse draft review render"));
zip.file("ppt/notesSlides/notesSlide1.xml", notesXml("Greet the audience."));
zip.file("ppt/notesSlides/notesSlide2.xml", notesXml("Walk through the four steps."));
zip.file("ppt/slides/_rels/slide1.xml.rels", rels("../notesSlides/notesSlide1.xml", "rId1", "notesSlide"));
zip.file("ppt/slides/_rels/slide2.xml.rels", rels("../notesSlides/notesSlide2.xml", "rId1", "notesSlide"));

writeFileSync(new URL(import.meta.url).pathname.replace(/make-fixture\.ts$/, "sample.pptx"), await zip.generateAsync({ type: "uint8array" }));
console.log("fixtures/sample.pptx written");
```

Run: `bun run fixtures/make-fixture.ts`

- [ ] **Step 2: Write the failing tests**

`tests/parse.test.ts`:

```typescript
import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { extractSlides } from "../src/parse/pptx";

const bytes = readFileSync(new URL("../fixtures/sample.pptx", import.meta.url));

describe("extractSlides", () => {
  test("extracts 2 slides with 1-based numbering", async () => {
    const slides = await extractSlides(new Uint8Array(bytes));
    expect(slides.length).toBe(2);
    expect(slides[0]?.slide).toBe(1);
    expect(slides[1]?.slide).toBe(2);
  });

  test("extracts title and body text", async () => {
    const slides = await extractSlides(new Uint8Array(bytes));
    expect(slides[0]?.title).toBe("Project Overview");
    expect(slides[0]?.body).toContain("Convert PPT to video");
  });

  test("extracts speaker notes linked via rels", async () => {
    const slides = await extractSlides(new Uint8Array(bytes));
    expect(slides[0]?.notes).toBe("Greet the audience.");
  });

  test("throws with slide context when a slide part is missing", async () => {
    const zip = new JSZip();
    const bytes2 = await zip.generateAsync({ type: "uint8array" });
    await expect(extractSlides(new Uint8Array(bytes2))).rejects.toThrow(/presentation\.xml/);
  });
});
```

(Note: the last test needs `import JSZip from "jszip"` added at the top.)

- [ ] **Step 3: Run test to verify it fails**

Run: `bun test tests/parse.test.ts`
Expected: FAIL — cannot resolve `../src/parse/pptx`.

- [ ] **Step 4: Implement pptx text/notes extraction**

`src/parse/pptx.ts`:

```typescript
import JSZip from "jszip";

export interface RawSlide {
  slide: number; // 1-based, aligned with PPT page numbers
  title: string;
  body: string[];
  notes: string;
}

interface SlideRels {
  notes?: string;
}

// Extract all <a:t> text runs from an XML string, in document order.
function extractTextRuns(xml: string): string[] {
  return [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1] ?? "");
}

// Parse presentation.xml's sldIdLst order via presentation.xml.rels
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

async function notesTargetForSlide(zip: JSZip, slidePath: string): Promise<string | undefined> {
  const relsPath = slidePath.replace("ppt/slides/", "ppt/slides/_rels/") + ".rels";
  const relsFile = zip.file(relsPath);
  if (!relsFile) return undefined;
  const relsXml = await relsFile.async("string");
  const m = relsXml.match(/Type="[^"]*\/notesSlide"[^>]*Target="([^"]+)"/);
  if (m?.[1]) return `ppt/${m[1].replace(/^\//, "")}`;
  const m2 = relsXml.match(/Target="([^"]+)"/g);
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
    const runs = extractTextRuns(xml);

    // Heuristic per design: title = first text run (title placeholder first in spTree),
    // remaining runs are body points.
    const [title, ...body] = runs;

    let notes = "";
    const notesPath = await notesTargetForSlide(zip, path);
    if (notesPath) {
      const notesFile = zip.file(notesPath);
      if (notesFile) notes = extractTextRuns(await notesFile.async("string")).join(" ").trim();
    }

    slides.push({
      slide: i + 1,
      title: title ?? "",
      body,
      notes,
    });
  }
  return slides;
}
```

Note on `notesTargetForSlide`: the regex order — first try a `notesSlide`-typed rel, fall back to scanning any Target. Simplify to a single pass: find the Relationship whose `Type` ends with `/notesSlide`, return its Target; if none, return `undefined`.

- [ ] **Step 5: Implement slide image rendering + CLI entry**

`src/parse/slides.ts`:

```typescript
import { mkdir } from "node:fs/promises";
import { $ } from "bun";

// Render each slide to PNG via LibreOffice → PDF → pdftoppm.
// Returns PNG paths in slide order, 1-based names slide-N.png.
export async function renderSlideImages(deckPath: string, outDir: string): Promise<string[]> {
  await mkdir(outDir, { recursive: true });
  const tmpPdf = `${outDir}/deck.pdf`;

  await $`soffice --headless --convert-to pdf --outdir ${outDir} ${deckPath}`.quiet();
  // soffice names the pdf after the deck; move it to a stable name
  await $`mv ${outDir}/${deckPath.replace(/.*\//, "").replace(/\.pptx$/, "")}.pdf ${tmpPdf}`;

  await $`pdftoppm -png -r 150 ${tmpPdf} ${outDir}/slide`.quiet();

  const glob = new Bun.Glob(`${outDir}/slide-*.png`);
  const paths = [...await glob.scan({ cwd: process.cwd() })].sort();
  if (paths.length === 0) throw new Error(`slide image rendering produced no output in ${outDir}`);
  // pdftoppm pads page numbers (slide-01.png); normalize to slide-N.png
  const normalized: string[] = [];
  for (let i = 0; i < paths.length; i++) {
    const n = i + 1;
    const target = `${outDir}/slide-${n}.png`;
    await $`mv ${paths[i]} ${target}`.quiet();
    normalized.push(target);
  }
  return normalized;
}
```

`src/parse/index.ts`:

```typescript
import { mkdir, writeFile } from "node:fs/promises";
import { extractSlides } from "./pptx";
import { renderSlideImages } from "./slides";
import { OutlineSchema } from "../schema";

async function main() {
  const deckPath = process.argv[2];
  if (!deckPath) throw new Error("usage: bun run parse <deck.pptx>");

  const pptxBytes = new Uint8Array(await Bun.file(deckPath).arrayBuffer());
  const rawSlides = await extractSlides(pptxBytes);
  const imagePaths = await renderSlideImages(deckPath, "build/slides");

  const outline = OutlineSchema.parse({
    deck: { title: deckPath.replace(/.*\//, "").replace(/\.pptx$/, ""), slideCount: rawSlides.length },
    slides: rawSlides.map((s, i) => ({ ...s, image: imagePaths[i] })),
  });

  await mkdir("build", { recursive: true });
  await writeFile("build/outline.json", JSON.stringify(outline, null, 2));
  console.log(`build/outline.json: ${rawSlides.length} slides`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `bun test tests/parse.test.ts`
Expected: 4 pass (CLI image rendering needs soffice/pdftoppm; test only covers `extractSlides` — image path is smoke-tested in Task 7).

- [ ] **Step 7: Commit**

```bash
git add src/parse/ tests/parse.test.ts fixtures/
git commit -m "feat: parse pptx into outline.json with per-slide text, notes, and image rendering"
```

---

### Task 3: draft — schema-validation CLI for agent-written scripts

**Files:**
- Create: `src/draft/index.ts`
- Test: `tests/align.test.ts`
- Create: `src/draft/align.ts` (shared alignment check, consumed by review too)

**Interfaces:**
- Consumes: `validateScript` from Task 1.
- Produces: `checkAlignment(outline: Outline, script: Script): string[]` — returns problem strings; empty array = aligned. Rules: every segment `slide` must exist in outline slides, no duplicates, page numbers contiguous from 1..slideCount, no slide without a segment. CLI `bun run draft <script.json>` validates schema + alignment against `build/outline.json`, exits 1 with problem list on failure.

- [ ] **Step 1: Write the failing test**

`tests/align.test.ts`:

```typescript
import { describe, test, expect } from "bun:test";
import { checkAlignment } from "../src/draft/align";
import type { Outline, Script } from "../src/schema";

const outline: Outline = {
  deck: { title: "D", slideCount: 3 },
  slides: [1, 2, 3].map((n) => ({ slide: n, title: `T${n}`, body: [], notes: "", image: `slide-${n}.png` })),
};

const script = (slides: number[]): Script => ({
  deck: outline.deck,
  segments: slides.map((n) => ({ slide: n, narration: `narration ${n}` })),
});

describe("checkAlignment", () => {
  test("passes for complete contiguous coverage", () => {
    expect(checkAlignment(outline, script([1, 2, 3]))).toEqual([]);
  });

  test("flags missing slide", () => {
    expect(checkAlignment(outline, script([1, 2]))).toEqual([expect.stringMatching(/missing|no segment/i)]);
  });

  test("flags duplicate slide", () => {
    const problems = checkAlignment(outline, script([1, 2, 3, 3]));
    expect(problems.some((p) => /duplicate/i.test(p))).toBe(true);
  });

  test("flags slide number beyond deck", () => {
    const problems = checkAlignment(outline, script([1, 2, 4]));
    expect(problems.some((p) => /4/.test(p))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/align.test.ts`
Expected: FAIL — cannot resolve `../src/draft/align`.

- [ ] **Step 3: Implement alignment check**

`src/draft/align.ts`:

```typescript
import type { Outline, Script } from "../schema";

// Alignment invariant (spec): segments align to slides by the `slide` field,
// never array order. Returns problem list; empty = aligned.
export function checkAlignment(outline: Outline, script: Script): string[] {
  const problems: string[] = [];
  const slideNums = new Set(outline.slides.map((s) => s.slide));
  const seen = new Set<number>();

  for (const seg of script.segments) {
    if (seen.has(seg.slide)) problems.push(`duplicate segment for slide ${seg.slide}`);
    seen.add(seg.slide);
    if (!slideNums.has(seg.slide)) problems.push(`segment references slide ${seg.slide} which does not exist in outline`);
  }

  for (let n = 1; n <= outline.deck.slideCount; n++) {
    if (!seen.has(n)) problems.push(`slide ${n} has no segment (missing narration)`);
  }

  return problems;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/align.test.ts`
Expected: 4 pass.

- [ ] **Step 5: Implement CLI**

`src/draft/index.ts`:

```typescript
import { validateScript, validateOutline } from "../schema";
import { checkAlignment } from "./align";

async function main() {
  const scriptPath = process.argv[2] ?? "build/script.json";
  const scriptData = await Bun.file(scriptPath).json();
  const script = validateScript(scriptData);

  const outlineData = await Bun.file("build/outline.json").json();
  const outline = validateOutline(outlineData);

  const problems = checkAlignment(outline, script);
  if (problems.length > 0) {
    for (const p of problems) console.error(`- ${p}`);
    process.exit(1);
  }
  console.log(`script.json valid: ${script.segments.length} segments aligned to ${outline.deck.slideCount} slides`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
```

- [ ] **Step 6: Commit**

```bash
git add src/draft/ tests/align.test.ts
git commit -m "feat: draft validation CLI with slide-narration alignment invariant"
```

---

### Task 4: review — review gate (alignment gate + review checklist)

**Files:**
- Create: `src/review/index.ts`
- Modify: nothing new to test — reuses `checkAlignment`; gate behavior is CLI exit code, covered by e2e smoke in Task 7.

**Interfaces:**
- Consumes: `validateScript`, `validateOutline`, `checkAlignment`.
- Produces: CLI `bun run review [script.json]` — review gate. Checks: (1) schema valid, (2) alignment problems, (3) segments where `narration` is empty/whitespace. Exit 0 = gate passed; exit 1 with a numbered problem list (the "issue list") the agent uses to revise the draft.

- [ ] **Step 1: Implement review CLI**

`src/review/index.ts`:

```typescript
import { validateScript, validateOutline } from "../schema";
import { checkAlignment } from "../draft/align";

async function main() {
  const scriptPath = process.argv[2] ?? "build/script.json";
  const script = validateScript(await Bun.file(scriptPath).json());
  const outline = validateOutline(await Bun.file("build/outline.json").json());

  const problems: string[] = [];
  problems.push(...checkAlignment(outline, script));
  for (const seg of script.segments) {
    if (seg.narration.trim().length === 0) problems.push(`slide ${seg.slide}: narration is empty`);
  }

  if (problems.length > 0) {
    console.error(`REVIEW FAILED — ${problems.length} problem(s):`);
    problems.forEach((p, i) => console.error(`${i + 1}. ${p}`));
    process.exit(1);
  }
  console.log(`REVIEW PASSED — ${script.segments.length} segments ready for render`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
```

- [ ] **Step 2: Verify gate behavior manually**

```bash
bun run review fixtures/bad-script.json  # expect exit 1, numbered problems
```

(`fixtures/bad-script.json` is a small invalid script with a duplicate slide and an empty narration, created inline during verification.)

- [ ] **Step 3: Commit**

```bash
git add src/review/
git commit -m "feat: review gate CLI producing numbered problem list"
```

---

### Task 5: render/tts — edge-tts audio with duration backfill

**Files:**
- Create: `src/render/tts.ts`
- Test: `tests/tts.test.ts`

**Interfaces:**
- Consumes: `Script` type from Task 1.
- Produces: `synthesizeAll(scriptPath: string, audioDir: string): Promise<{ script: Script; audio: string[] }>` — runs `edge-tts --voice zh-CN-XiaoxiaoNeural --text <narration> --write-media <out>` per segment, probes durations, returns script with `durationSec` filled and audio paths in segment order. Duration probe helper `probeDurationSec(path: string): Promise<number>` uses `ffprobe`.

- [ ] **Step 1: Write the failing test (mocked subprocess)**

`tests/tts.test.ts`:

```typescript
import { describe, test, expect, mock } from "bun:test";
import { computeSegmentPlan } from "../src/render/tts";
import type { Script } from "../src/schema";

describe("computeSegmentPlan", () => {
  test("computes frames and writes durations back in segment order", () => {
    const script: Script = {
      deck: { title: "D", slideCount: 2 },
      segments: [
        { slide: 1, narration: "a" },
        { slide: 2, narration: "b" },
      ],
    };
    const durations = [3.5, 2.0];
    const plan = computeSegmentPlan(script, durations);
    expect(plan.segments[0]?.durationSec).toBeCloseTo(3.5);
    expect(plan.segments[1]?.durationSec).toBeCloseTo(2.0);
  });

  test("rejects zero-duration probe result", () => {
    const script: Script = {
      deck: { title: "D", slideCount: 1 },
      segments: [{ slide: 1, narration: "a" }],
    };
    expect(() => computeSegmentPlan(script, [0])).toThrow(/duration/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/tts.test.ts`
Expected: FAIL — `computeSegmentPlan` not exported.

- [ ] **Step 3: Implement tts module**

`src/render/tts.ts`:

```typescript
import { mkdir } from "node:fs/promises";
import { $ } from "bun";
import type { Script } from "../schema";
import { validateScript } from "../schema";

export const VOICE = "zh-CN-XiaoxiaoNeural";

// Pure function: given probed durations, return script with durationSec filled.
export function computeSegmentPlan(script: Script, durationsSec: number[]): Script {
  if (durationsSec.length !== script.segments.length) {
    throw new Error(`duration probe count ${durationsSec.length} != segment count ${script.segments.length}`);
  }
  const segments = script.segments.map((seg, i) => {
    const d = durationsSec[i]!;
    if (d <= 0) throw new Error(`slide ${seg.slide}: probed audio duration must be positive, got ${d}`);
    return { ...seg, durationSec: d };
  });
  return { ...script, segments };
}

export async function probeDurationSec(path: string): Promise<number> {
  const res = await $`ffprobe -v error -show_entries format=duration -of csv=p=0 ${path}`.quiet();
  const d = Number.parseFloat(res.text.trim());
  if (!Number.isFinite(d) || d <= 0) throw new Error(`ffprobe could not read duration for ${path}`);
  return d;
}

// Synthesize narration audio per segment and backfill durations into script.json.
export async function synthesizeAll(scriptPath: string, audioDir: string): Promise<{ script: Script; audio: string[] }> {
  const script: Script = validateScript(await Bun.file(scriptPath).json());
  await mkdir(audioDir, { recursive: true });

  const audio: string[] = [];
  const durations: number[] = [];
  for (const seg of script.segments) {
    const out = `${audioDir}/segment-${seg.slide}.mp3`;
    await $`edge-tts --voice ${VOICE} --text ${seg.narration} --write-media ${out}`.quiet();
    audio.push(out);
    durations.push(await probeDurationSec(out));
  }

  const updated = computeSegmentPlan(script, durations);
  await Bun.write(scriptPath, JSON.stringify(updated, null, 2));
  return { script: updated, audio };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/tts.test.ts`
Expected: 2 pass. (`synthesizeAll`/`probeDurationSec` need the real CLI — exercised in the e2e smoke.)

- [ ] **Step 5: Commit**

```bash
git add src/render/tts.ts tests/tts.test.ts
git commit -m "feat: edge-tts synthesis with ffprobe duration backfill"
```

---

### Task 6: render/remotion — Remotion project + render CLI

**Files:**
- Create: `src/render/remotion/Root.tsx`, `src/render/remotion/SlideComposition.tsx`, `src/render/index.ts`
- Create: `remotion.config.ts`

**Interfaces:**
- Consumes: `synthesizeAll` from Task 5; `Script`/`Outline` types.
- Produces: CLI `bun run render [script.json]` — full render pipeline: TTS → Remotion bundle render → `output/video.mp4`. `SlideComposition` props: `{ image: string; narration: string; audio: string; durationSec: number; title: string }`.

- [ ] **Step 1: Add Remotion dependencies**

```bash
bun add remotion @remotion/cli
```

- [ ] **Step 2: Implement SlideComposition**

`src/render/remotion/SlideComposition.tsx`:

```tsx
import React from "react";
import { AbsoluteFill, Audio, Img, staticFile } from "remotion";

export interface SlideProps {
  title: string;
  image: string; // path under build/slides, resolved via staticFile
  audio: string; // path under build/audio
  durationSec: number;
}

// FPS 30; duration in frames derived from narration audio length.
export const FPS = 30;

export const SlideComposition: React.FC<SlideProps> = ({ title, image, audio, durationSec }) => {
  const frames = Math.ceil(durationSec * FPS);
  return (
    <AbsoluteFill>
      <Audio src={staticFile(audio)} />
      <Img src={staticFile(image)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      {/* subtitle bar: narration title shown at bottom during the slide */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 40,
          right: 40,
          background: "rgba(0,0,0,0.55)",
          color: "white",
          padding: "12px 20px",
          borderRadius: 8,
          fontSize: 28,
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  );
};
```

Subtitle text uses the slide title (from outline). Per-segment narration subtitle text can be added by passing `narration` and splitting per duration — YAGNI for v1; the composition shows one slide per segment with its audio.

- [ ] **Step 3: Implement Root**

`src/render/remotion/Root.tsx`:

```tsx
import React from "react";
import { Composition } from "remotion";
import { SlideComposition, FPS } from "./SlideComposition";
import type { Script } from "../../schema";

export interface RootProps {
  outline: { slides: Array<{ slide: number; title: string; image: string }> };
  script: Script;
  audio: string[];
}

export const RemotionRoot: React.FC<RootProps> = ({ outline, script, audio }) => {
  return (
    <>
      {script.segments.map((seg, i) => {
        const slide = outline.slides.find((s) => s.slide === seg.slide);
        if (!slide) throw new Error(`render: slide ${seg.slide} missing from outline`);
        const durationSec = seg.durationSec ?? 3;
        return (
          <Composition
            key={seg.slide}
            id={`slide-${seg.slide}`}
            component={SlideComposition}
            defaultProps={{ title: slide.title, image: slide.image, audio: audio[i] ?? "", durationSec }}
            durationInFrames={Math.ceil(durationSec * FPS)}
            fps={FPS}
            width={1920}
            height={1080}
          />
        );
      })}
    </>
  );
};
```

Note: v1 renders each slide as a separate composition; the CLI concatenates via `--sequence` or ffmpeg concat. Simpler alternative implemented in Task: render each segment to `output/segment-N.mp4`, then ffmpeg concat to `output/video.mp4` (see Step 4).

- [ ] **Step 4: Implement render CLI**

`src/render/index.ts`:

```typescript
import { $ } from "bun";
import { synthesizeAll } from "./tts";
import { validateOutline } from "../schema";

async function main() {
  const scriptPath = process.argv[2] ?? "build/script.json";
  const { script, audio } = await synthesizeAll(scriptPath, "build/audio");
  const outline = validateOutline(await Bun.file("build/outline.json").json());

  // Render each segment composition, then concat.
  const segmentVideos: string[] = [];
  for (let i = 0; i < script.segments.length; i++) {
    const seg = script.segments[i]!;
    const id = `slide-${seg.slide}`;
    const out = `output/segment-${seg.slide}.mp4`;
    await $`bunx remotion render src/render/remotion/Root.tsx ${id} ${out} --props=${JSON.stringify({
      outline: { slides: outline.slides.map((s) => ({ slide: s.slide, title: s.title, image: s.image })) },
      script,
      audio,
    })}`.quiet();
    segmentVideos.push(out);
  }

  // Concatenate with ffmpeg concat demuxer.
  const listFile = "output/segments.txt";
  await Bun.write(listFile, segmentVideos.map((v) => `file '${v}'`).join("\n"));
  await $`ffmpeg -f concat -safe 0 -i ${listFile} -c copy output/video.mp4`.quiet();
  console.log("output/video.mp4 rendered");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
```

`remotion.config.ts` (repo root):

```typescript
import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
```

- [ ] **Step 5: Commit**

```bash
git add src/render/ remotion.config.ts package.json bun.lockb
git commit -m "feat: Remotion render pipeline with per-slide compositions and ffmpeg concat"
```

---

### Task 7: e2e smoke + AGENTS.md update

**Files:**
- Modify: `AGENTS.md` (replace blueprint language with verified facts)
- Create: `build/` outputs from smoke run (not committed)

**Interfaces:**
- Consumes: all previous CLIs.
- Produces: verified end-to-end path on a sample deck; updated AGENTS.md reflecting real commands.

- [ ] **Step 1: Verify external CLIs, install if missing**

```bash
which soffice || brew install --cask libreoffice
which pdftoppm || brew install poppler
which edge-tts || pip3 install edge-tts
which ffmpeg || brew install ffmpeg
```

- [ ] **Step 2: Run e2e smoke**

```bash
bun run fixtures/make-fixture.ts  # fixture pptx has no images; use soffice-capable sample if needed
bun run parse fixtures/sample.pptx
# agent writes build/script.json for the 2-slide fixture
bun run draft build/script.json
bun run review build/script.json
bun run render build/script.json
ls output/video.mp4
```

Expected: video.mp4 exists and plays; review exit codes behave as documented.

- [ ] **Step 3: Run full test suite**

Run: `bun test`
Expected: all suites pass (schema, parse, align, tts).

- [ ] **Step 4: Update AGENTS.md**

Replace the "blueprint" banner and unverified command list with facts confirmed by the smoke run: real CLI paths, real schema field names, verified exit-code behavior of the review gate, actual test counts. Keep structure per original directives (title "Repository Guidelines", all sections).

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update AGENTS.md from blueprint to verified project facts"
```
