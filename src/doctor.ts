import { $ } from "bun";

// Environment doctor (spec: pre-parse gate; required for --auto orchestration).
// Checks every external dependency the pipeline shells out to, with version
// floors where they exist. Exit 1 when any hard requirement is unmet.
interface Check {
  name: string;
  cmd: string[];
  ok?: (out: string) => true | string; // return error string on failure
  required: boolean; // hard requirement vs advisory
}

const checks: Check[] = [
  { name: "bun", cmd: ["bun", "--version"], required: true },
  {
    name: "node (>=20.19 for Remotion rspack)",
    cmd: ["node", "--version"],
    ok: (out) => {
      const m = out.match(/v(\d+)\.(\d+)/);
      if (!m) return "unparseable node version";
      const [major, minor] = [Number(m[1]), Number(m[2])];
      return major > 22 || (major === 20 && minor >= 19) || (major === 22 && minor >= 12) ? true : `node ${out.trim()} — need >=20.19 / 22.12 / >22`;
    },
    required: true,
  },
  { name: "soffice (LibreOffice)", cmd: ["soffice", "--version"], required: true },
  { name: "pdftoppm (poppler)", cmd: ["pdftoppm", "-v"], required: true },
  {
    name: "edge-tts (>=7.3.1)",
    cmd: ["edge-tts", "--version"],
    ok: (out) => {
      const m = out.match(/(\d+)\.(\d+)\.(\d+)/);
      if (!m) return "unparseable edge-tts version";
      const [maj, min] = [Number(m[1]), Number(m[2])];
      return maj > 7 || (maj === 7 && min >= 3) ? true : `edge-tts ${out.trim()} — need >=7.3.1 (older builds get 403 from Microsoft)`;
    },
    required: true,
  },
  { name: "ffmpeg", cmd: ["ffmpeg", "-version"], required: true },
  {
    name: "browser (Remotion render target)",
    cmd: ["test", "-d", "/Applications/Google Chrome.app"],
    required: false,
  },
];

let failed = 0;
for (const c of checks) {
  try {
    const proc = Bun.spawnSync(c.cmd, { stdout: "pipe", stderr: "pipe" });
    const out = `${proc.stdout.toString()}${proc.stderr.toString()}`.trim();
    const verdict = proc.exitCode === 0 && c.ok ? c.ok(out) : proc.exitCode === 0 ? true : `exit ${proc.exitCode}`;
    if (verdict === true) console.log(`  OK      ${c.name}`);
    else {
      failed++;
      console.log(`  ${c.required ? "FAIL" : "WARN"}    ${c.name} — ${verdict}`);
    }
  } catch (e) {
    if (c.required) failed++;
    console.log(`  ${c.required ? "FAIL" : "WARN"}    ${c.name} — not found`);
  }
}

// TTS connectivity probe (network + Microsoft service reachability).
console.log("\nTTS connectivity probe:");
const probe = Bun.spawnSync(["edge-tts", "--voice", "zh-CN-XiaoxiaoNeural", "--text", "ping", "--write-media", "/tmp/tts-probe.mp3"], {
  stdout: "pipe",
  stderr: "pipe",
  timeout: 30_000,
});
const probeSize = (() => {
  try {
    return Bun.file("/tmp/tts-probe.mp3").size;
  } catch {
    return 0;
  }
})();
if (probe.exitCode === 0 && probeSize > 0) {
  console.log("  OK      edge-tts service reachable");
} else {
  failed++;
  console.log(`  FAIL    edge-tts service unreachable (exit ${probe.exitCode}, ${probeSize} bytes) — check network/proxy`);
  const err = probe.stderr.toString().trim();
  if (err) console.log(`          ${err.split("\n").slice(-2).join("\n          ")}`);
}

console.log(failed === 0 ? "\ndoctor: ALL PASS" : `\ndoctor: ${failed} problem(s)`);
process.exit(failed === 0 ? 0 : 1);
