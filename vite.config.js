import { defineConfig, loadEnv } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import reviewsHandler from "./api/reviews.js";
import sendEmailHandler from "./api/send-email.js";

const root = fileURLToPath(new URL(".", import.meta.url));

/** Entrées HTML : sans cela, `vite build` ne sort que index.html → 404 sur Vercel pour contact, à propos, etc. */
const htmlEntries = {
  index: resolve(root, "index.html"),
  contact: resolve(root, "contact.html"),
  apropos: resolve(root, "a-propos.html"),
  mentions: resolve(root, "mentions-legales.html"),
  marketplace: resolve(root, "marketplace.html"),
};

function avisApiDevPlugin() {
  return {
    name: "avis-api-dev",
    configureServer(server) {
      server.middlewares.use("/api/reviews", async (req, res) => {
        await reviewsHandler(req, res);
      });
      server.middlewares.use("/api/send-email", async (req, res) => {
        await sendEmailHandler(req, res);
      });
    },
  };
}

/** Site statique : fichiers à la racine (HTML, assets/, src/). */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, "");
  // Server-only variables: never inject these into the browser bundle.
  for (const key of ["RESEND_API_KEY", "RESEND_FROM", "RESEND_TO", "GOOGLE_PLACES_API_KEY", "GOOGLE_PLACE_ID", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "CONTACT_RATE_LIMIT_SECRET"]) {
    if (!process.env[key] && env[key]) process.env[key] = env[key];
  }
  return {
  plugins: [avisApiDevPlugin()],
  server: {
    open: true,
  },
  build: {
    rollupOptions: {
      input: htmlEntries,
    },
  },
  };
});
