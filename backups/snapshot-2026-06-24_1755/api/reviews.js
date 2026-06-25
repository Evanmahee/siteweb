import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchGooglePlaceReviews, mergeGoogleReviews } from "../scripts/google-reviews-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const avisPath = path.join(root, "public", "avis.json");

let memoryCache = null;
let memoryCacheAt = 0;
const CACHE_MS = 6 * 60 * 60 * 1000;

function readSeed() {
  return JSON.parse(fs.readFileSync(avisPath, "utf8"));
}

async function buildPayload() {
  const now = Date.now();
  if (memoryCache && now - memoryCacheAt < CACHE_MS) {
    return memoryCache;
  }

  let data = readSeed();
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (apiKey && placeId) {
    try {
      const place = await fetchGooglePlaceReviews(apiKey, placeId);
      data = mergeGoogleReviews(data, place);
    } catch (err) {
      console.error("Google Places sync failed:", err);
    }
  }

  memoryCache = data;
  memoryCacheAt = now;
  return data;
}

function sendJson(res, status, data) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    res.status(status).json(data);
    return;
  }
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  if (req.method && req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const data = await buildPayload();
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    sendJson(res, 200, data);
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: "Impossible de charger les avis." });
  }
}
