import { defineConfig, loadEnv } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import reviewsHandler from "./api/reviews.js";
import sendEmailHandler from "./api/send-email.js";

const root = fileURLToPath(new URL(".", import.meta.url));

/** Pages actuelles uniquement ; les anciennes URL redirigent vers la one page. */
const htmlEntries = {
  index: resolve(root, "index.html"),
  mentions: resolve(root, "mentions-legales.html"),
  marketplace: resolve(root, "marketplace.html"),
};

function avisApiDevPlugin() {
  return {
    name: "avis-api-dev",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url || "").split("?")[0];
        const destination = {
          "/contact": "/#contact",
          "/contact.html": "/#contact",
          "/a-propos": "/#apropos",
          "/a-propos.html": "/#apropos",
        }[path];
        if (!destination) return next();
        res.writeHead(308, { Location: destination });
        res.end();
      });
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
