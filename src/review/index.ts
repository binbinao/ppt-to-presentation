import { validateScript, validateOutline } from "../schema";
import { checkAlignment } from "../draft/align";

// Review gate (spec step 3): schema + alignment + narration sanity.
// Exit 0 = passed; exit 1 prints numbered problem list for the agent to revise.
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
