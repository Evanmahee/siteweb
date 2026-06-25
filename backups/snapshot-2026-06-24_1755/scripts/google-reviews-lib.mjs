/**
 * Fusionne les avis Google Places (max. 5 récents) avec le cache local.
 */
export function mergeGoogleReviews(cache, place) {
  const reviews = Array.isArray(cache.reviews) ? [...cache.reviews] : [];
  const googleTotal = place.userRatingCount ?? cache.googleTotal ?? reviews.length;
  const incoming = Array.isArray(place.reviews) ? place.reviews : [];

  const keys = new Set(
    reviews.map((r) => reviewKey(r))
  );

  for (const g of incoming) {
    const mapped = mapGoogleReview(g);
    if (!mapped) continue;
    const key = reviewKey(mapped);
    if (keys.has(key)) continue;
    keys.add(key);
    reviews.unshift(mapped);
  }

  return {
    googleTotal,
    updatedAt: new Date().toISOString(),
    reviews,
  };
}

function reviewKey(review) {
  if (review.publishTime) return `${review.name}|${review.publishTime}`;
  return `${review.name}|${(review.text || "").slice(0, 80)}`;
}

function mapGoogleReview(review) {
  const name = review.authorAttribution?.displayName?.trim();
  const text = (review.text?.text || review.originalText?.text || "").trim();
  if (!name || !text) return null;

  return {
    name,
    date: review.relativePublishTimeDescription || review.publishTime || "",
    text,
    rating: review.rating,
    publishTime: review.publishTime,
    source: "google",
  };
}

export async function fetchGooglePlaceReviews(apiKey, placeId) {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "reviews,userRatingCount,rating",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Places API ${res.status}: ${body}`);
  }

  return res.json();
}
