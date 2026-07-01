import seedAvis from "../public/avis.json";

const GOOGLE_ICON_SVG =
  '<svg viewBox="0 0 24 24" width="18" height="18" focusable="false">' +
  '<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>' +
  '<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>' +
  '<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>' +
  '<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>' +
  "</svg>";

const TONE_CYCLE = ["chestnut", "forest", "brown", "dark", "violet", "teal"];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function reviewInitial(review) {
  const name = review.name || "";
  const ch = name.trim().charAt(0);
  if (!ch) return "?";
  return review.initialLower ? ch.toLowerCase() : ch.toUpperCase();
}

function reviewTone(review, index) {
  if (review.tone) return review.tone;
  return TONE_CYCLE[index % TONE_CYCLE.length];
}

export function cardsPerSlide() {
  if (typeof window === "undefined") return 3;
  const w = window.innerWidth;
  if (w <= 560) return 1;
  if (w <= 900) return 2;
  return 3;
}

function renderCard(review, quoteId) {
  const tone = reviewTone(review, quoteId - 1);
  const initial = reviewInitial(review);
  const lowerClass = review.initialLower ? " avis__avatar--lower" : "";
  const stars =
    '<span class="avis__star avis__star--sm"></span>'.repeat(5) +
    '<span class="avis__verified" title="Avis Google vérifié"></span>';

  return (
    '<article class="avis__card">' +
    '<header class="avis__card-head">' +
    '<span class="avis__avatar avis__avatar--initial avis__avatar--tone-' +
    escapeHtml(tone) +
    lowerClass +
    '" aria-hidden="true">' +
    escapeHtml(initial) +
    "</span>" +
    '<div class="avis__card-meta">' +
    '<p class="avis__name">' +
    escapeHtml(review.name) +
    "</p>" +
    '<p class="avis__tagline">' +
    escapeHtml(review.date) +
    "</p>" +
    "</div>" +
    '<span class="avis__g-icon" aria-hidden="true">' +
    GOOGLE_ICON_SVG +
    "</span>" +
    "</header>" +
    '<div class="avis__card-stars" aria-hidden="true">' +
    stars +
    "</div>" +
    '<div class="avis__quote">' +
    '<p class="avis__text" id="avis-quote-' +
    quoteId +
    '">' +
    escapeHtml(review.text) +
    "</p>" +
    '<button type="button" class="avis__toggle" hidden aria-expanded="false" aria-controls="avis-quote-' +
    quoteId +
    '">Voir plus</button>' +
    "</div>" +
    "</article>"
  );
}

export function renderAvisSlides(track, reviews, perSlide) {
  if (!track || !reviews.length) return 0;

  const slides = [];
  for (let i = 0; i < reviews.length; i += perSlide) {
    slides.push(reviews.slice(i, i + perSlide));
  }

  let quoteId = 1;
  const slidesHtml = slides
    .map(function (chunk, slideIndex) {
      const from = slideIndex * perSlide + 1;
      const to = Math.min((slideIndex + 1) * perSlide, reviews.length);
      const cardsHtml = chunk
        .map(function (review) {
          const html = renderCard(review, quoteId);
          quoteId += 1;
          return html;
        })
        .join("");

      return (
        '<div class="avis__slide" id="avis-slide-' +
        slideIndex +
        '" aria-label="Avis ' +
        from +
        " à " +
        to +
        " sur " +
        reviews.length +
        '">' +
        '<div class="avis__slide-grid" data-avis-per-slide="' +
        perSlide +
        '">' +
        cardsHtml +
        "</div></div>"
      );
    })
    .join("");

  track.innerHTML = slidesHtml;
  track.style.setProperty("--avis-n", String(slides.length));
  track.style.setProperty("--avis-i", "0");
  return slides.length;
}

export function updateAvisCount(data) {
  const countEl = document.querySelector("#avis-count");
  if (!countEl || !data) return;
  const total = data.googleTotal || (data.reviews && data.reviews.length) || 0;
  countEl.textContent = total + " avis au total présents sur Google";
}

function normalizeAvisPayload(data) {
  if (!data || !Array.isArray(data.reviews) || !data.reviews.length) return null;
  return data;
}

export async function fetchAvisData() {
  const sources = ["/avis.json", "/api/reviews"];

  for (const url of sources) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) continue;
      const data = normalizeAvisPayload(await res.json());
      if (data) return data;
    } catch (_err) {
      /* essai source suivante */
    }
  }

  return normalizeAvisPayload(seedAvis);
}

export async function loadAndRenderAvis() {
  const section = document.querySelector("#temoignages");
  if (!section) return null;

  const track = section.querySelector("[data-avis-track]");
  if (!track) return null;

  const data = await fetchAvisData();
  if (!data) {
    const countEl = section.querySelector("#avis-count");
    if (countEl) countEl.textContent = "Avis clients Google";
    return null;
  }

  updateAvisCount(data);
  renderAvisSlides(track, data.reviews, cardsPerSlide());
  return data;
}
