import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Lazy-load pdf-parse only when needed (it has a heavy import side-effect)
export const extractPdfText = async (filePath) => {
  if (path.extname(filePath).toLowerCase() !== ".pdf") {
    return ""; // doc/docx not parsed in this build
  }
  try {
    // Require the lib file directly — importing the package index runs a
    // debug block that tries to read a bundled test PDF and can throw.
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (e) {
    console.error("PDF parse error:", e.message);
    return "";
  }
};
