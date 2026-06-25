import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const reviews = [];
const cardRe = /<article class="avis__card">([\s\S]*?)<\/article>/g;
let m;

while ((m = cardRe.exec(html))) {
  const block = m[1];
  const name = block.match(/<p class="avis__name">([^<]+)</)?.[1]?.trim();
  const date = block.match(/<p class="avis__tagline">([^<]+)</)?.[1]?.trim();
  const toneM = block.match(/avis__avatar--tone-([a-z]+)/);
  const lower = block.includes("avis__avatar--lower");
  const textM = block.match(/<p class="avis__text"[^>]*>([\s\S]*?)<\/p>/);
  if (!name || !textM) continue;
  const text = textM[1].replace(/\s+/g, " ").trim();
  const review = { name, date, text };
  if (toneM) review.tone = toneM[1];
  if (lower) review.initialLower = true;
  reviews.push(review);
}

const out = {
  googleTotal: 29,
  updatedAt: new Date().toISOString(),
  reviews,
};

fs.mkdirSync(path.join(root, "public"), { recursive: true });
fs.writeFileSync(path.join(root, "public", "avis.json"), JSON.stringify(out, null, 2) + "\n");
console.log("Extracted", reviews.length, "reviews → public/avis.json");
