import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import JSZip from "jszip";
import { extractSlides } from "../src/parse/pptx";

const bytes = readFileSync(new URL("../fixtures/sample.pptx", import.meta.url));

// Synthesize a minimal valid pptx zip with full OOXML parts for regression tests.
interface SlideSpec {
  title: string;
  body: string;
  notes: string;
}
interface FixtureOptions {
  attributeOrder?: "id-first" | "target-first";
  quoting?: "double" | "single";
  splitRuns?: boolean; // split title/body text across two <a:r> runs
  titleAfterBody?: boolean; // body text box precedes title in spTree
  omitNotes?: boolean;
}

const rel = (attrs: string) => `  <Relationship ${attrs}/>\n`;

function relsDoc(entries: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${entries.join("")}</Relationships>`;
}

// Build rel attributes with controllable order/quoting to regression-test the parser.
function relAttrs(o: { id: string; type: string; target: string; order?: string; quoting?: string }): string {
  const q = o.quoting === "single" ? "'" : '"';
  const idPart = `Id=${q}${o.id}${q}`;
  const typePart = `Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${o.type}"`;
  const targetPart = `Target=${q}${o.target}${q}`;
  return o.order === "target-first" ? `${targetPart} ${idPart} ${typePart}` : `${idPart} ${typePart} ${targetPart}`;
}

function buildFixtureZip(zip: JSZip, slides: SlideSpec[], opts: FixtureOptions = {}): JSZip {
  const order = opts.attributeOrder ?? "id-first";
  const quoting = opts.quoting ?? "double";

  const slideXml = (s: SlideSpec) => {
    const runs = (text: string, size: string) =>
      opts.splitRuns
        ? `<a:r><a:rPr lang="en-US" sz="${size}"/><a:t>${text.slice(0, 3)}</a:t></a:r><a:r><a:rPr lang="en-US" sz="${size}"/><a:t>${text.slice(3)}</a:t></a:r>`
        : `<a:r><a:rPr lang="en-US" sz="${size}"/><a:t>${text}</a:t></a:r>`;
    const titleSp = `    <p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="1524000" y="304800"/><a:ext cx="9144000" cy="1219200"/></a:xfrm></p:spPr><p:txBody><a:bodyPr/><a:p>${runs(s.title, "4400")}</a:p></p:txBody></p:sp>\n`;
    const bodySp = `    <p:sp><p:nvSpPr><p:cNvPr id="3" name="Content"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="1524000" y="1828800"/><a:ext cx="9144000" cy="3200400"/></a:xfrm></p:spPr><p:txBody><a:bodyPr/><a:p>${runs(s.body, "2400")}</a:p></p:txBody></p:sp>\n`;
    // titleAfterBody regression: body precedes title in spTree, parser must
    // still pick the title placeholder's text as the title.
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr/>
${opts.titleAfterBody ? bodySp + titleSp : titleSp + bodySp}  </p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
  };

  const notesXml = (s: SlideSpec) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:notes xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr/>
    <p:sp><p:nvSpPr><p:cNvPr id="2" name="Notes"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:p><a:r><a:rPr lang="en-US"/><a:t>${s.notes}</a:t></a:r></a:p></p:txBody></p:sp>
  </p:spTree></p:cSld>
</p:notes>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
${slides.map((_, i) => `  <Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>\n`).join("")}${slides.map((_, i) => `  <Override PartName="/ppt/notesSlides/notesSlide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>\n`).join("")}  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
</Types>`;

  zip.file("[Content_Types].xml", contentTypes);
  zip.file("_rels/.rels", relsDoc([rel(relAttrs({ id: "rId1", type: "officeDocument", target: "ppt/presentation.xml", order, quoting }))]));
  zip.file("ppt/presentation.xml", `<?xml version="1.0"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rIdS${i + 1}"/>`).join("")}</p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000"/>
</p:presentation>`);
  zip.file("ppt/_rels/presentation.xml.rels", relsDoc([
    rel(relAttrs({ id: "rId1", type: "slideMaster", target: "slideMasters/slideMaster1.xml", order, quoting })),
    ...slides.map((_, i) => rel(relAttrs({ id: `rIdS${i + 1}`, type: "slide", target: `slides/slide${i + 1}.xml`, order, quoting }))),
    rel(relAttrs({ id: "rIdT", type: "theme", target: "theme/theme1.xml", order, quoting })),
  ]));

  slides.forEach((s, i) => {
    const n = i + 1;
    zip.file(`ppt/slides/slide${n}.xml`, slideXml(s));
    const slideRels: string[] = [rel(relAttrs({ id: "rIdL", type: "slideLayout", target: "../slideLayouts/slideLayout1.xml", order, quoting }))];
    if (!opts.omitNotes) {
      slideRels.push(rel(relAttrs({ id: "rIdN", type: "notesSlide", target: `../notesSlides/notesSlide${n}.xml`, order, quoting })));
      zip.file(`ppt/notesSlides/notesSlide${n}.xml`, notesXml(s));
      zip.file(`ppt/notesSlides/_rels/notesSlide${n}.xml.rels`, relsDoc([rel(relAttrs({ id: "rId1", type: "slide", target: `../slides/slide${n}.xml`, order, quoting }))]));
    }
    zip.file(`ppt/slides/_rels/slide${n}.xml.rels`, relsDoc(slideRels));
  });

  zip.file("ppt/slideLayouts/slideLayout1.xml", `<?xml version="1.0"?><p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld name="L"/><p:clrMapOvr><a:masterClrMapping xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"/></p:clrMapOvr></p:sldLayout>`);
  zip.file("ppt/slideLayouts/_rels/slideLayout1.xml.rels", relsDoc([rel(relAttrs({ id: "rId1", type: "slideMaster", target: "../slideMasters/slideMaster1.xml", order, quoting }))]));
  zip.file("ppt/slideMasters/slideMaster1.xml", `<?xml version="1.0"?><p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:cSld/><p:clrMap><a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:accent1><a:srgbClr val="4F81BD"/></a:accent1></p:clrMap><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>`);
  zip.file("ppt/slideMasters/_rels/slideMaster1.xml.rels", relsDoc([rel(relAttrs({ id: "rId1", type: "slideLayout", target: "../slideLayouts/slideLayout1.xml", order, quoting }))]));
  zip.file("ppt/theme/theme1.xml", `<?xml version="1.0"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="T"><a:themeElements><a:clrScheme name="C"><a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1></a:clrScheme><a:fontScheme name="F"><a:majorFont><a:latin typeface="Calibri"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme><a:fmtScheme name="M"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`);
  return zip;
}

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

  test("throws with part context when presentation.xml is missing", async () => {
    const zip = new JSZip();
    const emptyBytes = await zip.generateAsync({ type: "uint8array" });
    await expect(extractSlides(new Uint8Array(emptyBytes))).rejects.toThrow(/presentation\.xml/);
  });

  test("decodes XML entities in title, body, and notes", async () => {
    const zip = new JSZip();
    const fixture = buildFixtureZip(zip, [
      { title: "A &amp; B &lt;C&gt;", body: "&#20215;&#26684; &#8226; &#20013;&#22269;", notes: "Tom &amp; Jerry" },
    ]);
    const bytes = await fixture.generateAsync({ type: "uint8array" });
    const slides = await extractSlides(new Uint8Array(bytes));
    expect(slides[0]?.title).toBe("A & B <C>");
    expect(slides[0]?.body[0]).toBe("价格 • 中国");
    expect(slides[0]?.notes).toBe("Tom & Jerry");
  });

  test("parses rels regardless of attribute order and quoting", async () => {
    const zip = new JSZip();
    const fixture = buildFixtureZip(zip, [
      { title: "T1", body: "b1", notes: "n1" },
    ], { attributeOrder: "target-first", quoting: "single" });
    const bytes = await fixture.generateAsync({ type: "uint8array" });
    const slides = await extractSlides(new Uint8Array(bytes));
    expect(slides.length).toBe(1);
    expect(slides[0]?.notes).toBe("n1");
  });

  test("joins runs within a paragraph instead of splitting them", async () => {
    const zip = new JSZip();
    const fixture = buildFixtureZip(zip, [
      { title: "Title split", body: "Body text joined", notes: "" },
    ], { splitRuns: true });
    const bytes = await fixture.generateAsync({ type: "uint8array" });
    const slides = await extractSlides(new Uint8Array(bytes));
    expect(slides[0]?.title).toBe("Title split");
    expect(slides[0]?.body).toEqual(["Body text joined"]);
  });

  test("uses title placeholder text as the slide title", async () => {
    const zip = new JSZip();
    // Body text box appears BEFORE the title placeholder in document order.
    const fixture = buildFixtureZip(zip, [
      { title: "Real Title", body: "first in doc order", notes: "" },
    ], { titleAfterBody: true });
    const bytes = await fixture.generateAsync({ type: "uint8array" });
    const slides = await extractSlides(new Uint8Array(bytes));
    expect(slides[0]?.title).toBe("Real Title");
    expect(slides[0]?.body).toContain("first in doc order");
  });

  test("handles slides without notes rels", async () => {
    const zip = new JSZip();
    const fixture = buildFixtureZip(zip, [
      { title: "No notes", body: "body", notes: "" },
    ], { omitNotes: true });
    const bytes = await fixture.generateAsync({ type: "uint8array" });
    const slides = await extractSlides(new Uint8Array(bytes));
    expect(slides[0]?.notes).toBe("");
  });
});
