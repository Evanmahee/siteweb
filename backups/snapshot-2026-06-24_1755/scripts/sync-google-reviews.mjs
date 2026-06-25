import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchGooglePlaceReviews, mergeGoogleReviews } from "./google-reviews-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const avisPath = path.join(root, "public", "avis.json");

const apiKey = process.env.GOOGLE_PLACES_API_KEY;
const placeId = process.env.GOOGLE_PLACE_ID;

if (!apiKey || !placeId) {
  console.error(
    "Variables manquantes : GOOGLE_PLACES_API_KEY et GOOGLE_PLACE_ID (voir .env.example)."
  );
  process.exit(1);
}

const cache = JSON.parse(fs.readFileSync(avisPath, "utf8"));
const place = await fetchGooglePlaceReviews(apiKey, placeId);
const merged = mergeGoogleReviews(cache, place);

fs.writeFileSync(avisPath, JSON.stringify(merged, null, 2) + "\n");
console.log(
  `Sync OK — ${merged.reviews.length} avis en cache, ${merged.googleTotal} au total sur Google.`
);
