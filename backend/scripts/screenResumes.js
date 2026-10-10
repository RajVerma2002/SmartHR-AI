// Batch-test AI resume screening on a folder of real CVs.
// Usage (from backend/):  npm run screen -- [folder] ["Position title"]
// Defaults: folder = ./resumes, position = "Software Engineer"
import "dotenv/config";
import fs from "fs";
import path from "path";
import { extractPdfText } from "../utils/cvText.js";
import { analyzeResume, aiStatus } from "../utils/geminiService.js";

const folder = path.resolve(process.argv[2] || "resumes");
const position = process.argv[3] || "Software Engineer";

// Below this many characters the PDF is almost certainly a scanned image
const MIN_TEXT_CHARS = 200;
// Stay under the Gemini free-tier requests-per-minute limit
const DELAY_MS = 7000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const main = async () => {
  if (!fs.existsSync(folder)) {
    console.error(`Folder not found: ${folder}\nCreate it and put some PDF resumes inside.`);
    process.exit(1);
  }

  const status = aiStatus();
  if (!status.configured) {
    console.error("GEMINI_API_KEY is not set in backend/.env — results would be sample output. Aborting.");
    process.exit(1);
  }

  const files = fs.readdirSync(folder).filter((f) => !fs.statSync(path.join(folder, f)).isDirectory());
  if (!files.length) {
    console.error(`No files in ${folder}`);
    process.exit(1);
  }

  const outDir = path.join(folder, "_screening");
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`Model: ${status.model} | Position: "${position}" | ${files.length} file(s)\n`);

  const rows = [];
  let calledAi = false;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const row = { file, chars: 0, status: "", score: "", recommendation: "", skills: "", summary: "" };

    if (ext !== ".pdf") {
      row.status = `skipped: ${ext || "no extension"} not supported (PDF only)`;
      rows.push(row);
      console.log(`- ${file}: ${row.status}`);
      continue;
    }

    const text = await extractPdfText(path.join(folder, file));
    row.chars = text.trim().length;
    // Save extracted text so you can check reading order (two-column layouts scramble it)
    fs.writeFileSync(path.join(outDir, `${path.parse(file).name}.txt`), text);

    if (row.chars < MIN_TEXT_CHARS) {
      row.status = "no usable text: likely a scanned/image PDF";
      rows.push(row);
      console.log(`- ${file}: ${row.status} (${row.chars} chars)`);
      continue;
    }

    if (calledAi) await sleep(DELAY_MS);
    calledAi = true;

    try {
      const r = await analyzeResume(text, position);
      row.status = r.score === null ? "AI returned unstructured output" : "ok";
      row.score = r.score ?? "";
      row.recommendation = r.recommendation;
      row.skills = (r.skills || []).join("; ");
      row.summary = r.summary;
    } catch (e) {
      row.status = `AI error: ${e.message}`;
    }

    rows.push(row);
    console.log(`- ${file}: ${row.score || "-"} / ${row.recommendation || row.status} | ${row.skills}`);
  }

  // my_score / my_notes are left blank for you to fill in and compare against the AI
  const header = ["file", "text_chars", "status", "ai_score", "ai_recommendation", "ai_skills", "ai_summary", "my_score", "my_notes"];
  const csv = [
    header.join(","),
    ...rows.map((r) =>
      [r.file, r.chars, r.status, r.score, r.recommendation, r.skills, r.summary, "", ""].map(csvCell).join(",")
    ),
  ].join("\n");
  const csvPath = path.join(outDir, "results.csv");
  fs.writeFileSync(csvPath, csv);

  console.log(`\nResults: ${csvPath}`);
  console.log(`Extracted text per resume: ${outDir}`);
};

main();
