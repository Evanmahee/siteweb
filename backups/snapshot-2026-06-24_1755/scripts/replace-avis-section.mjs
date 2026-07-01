import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "index.html");
let html = fs.readFileSync(file, "utf8");

const start = html.indexOf('<section class="avis" id="temoignages"');
const end = html.indexOf("</section>", start);
if (start === -1 || end === -1) {
  console.error("Section témoignages introuvable");
  process.exit(1);
}

const replacement = `<section class="avis" id="temoignages" aria-labelledby="avis-title" aria-describedby="avis-count">
        <div class="avis__inner">
          <h2 id="avis-title" class="avis__title">Témoignages</h2>
          <p id="avis-count" class="avis__count">Chargement des avis…</p>

          <div
            class="avis__carousel"
            role="region"
            aria-roledescription="carrousel"
            aria-label="Avis clients"
            data-avis-carousel
          >
            <button
              type="button"
              class="avis__nav avis__nav--prev"
              data-avis-prev
              aria-label="Avis précédents"
              hidden
            >
              <span aria-hidden="true">‹</span>
            </button>
            <div class="avis__viewport">
              <div class="avis__track" data-avis-track></div>
            </div>
            <button
              type="button"
              class="avis__nav avis__nav--next"
              data-avis-next
              aria-label="Avis suivants"
              hidden
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      </section>`;

html = html.slice(0, start) + replacement + html.slice(end + "</section>".length);
fs.writeFileSync(file, html, "utf8");
console.log("Section témoignages remplacée (carrousel dynamique)");
