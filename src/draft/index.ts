import { validateScript, validateOutline } from "../schema";
import { checkAlignment } from "./align";

// Validates agent-written script.json against schema + alignment invariant.
// Exit 1 with problem list when invalid; the agent revises and re-runs.
async function main() {
  const scriptPath = process.argv[2] ?? "build/script.json";
  const script = validateScript(await Bun.file(scriptPath).json());
  const outline = validateOutline(await Bun.file("build/outline.json").json());

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
