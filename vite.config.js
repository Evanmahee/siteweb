import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

/** Entrées HTML : sans cela, `vite build` ne sort que index.html → 404 sur Vercel pour contact, à propos, etc. */
const htmlEntries = {
  index: resolve(root, "index.html"),
  contact: resolve(root, "contact.html"),
  apropos: resolve(root, "a-propos.html"),
  mentions: resolve(root, "mentions-legales.html"),
  marketplace: resolve(root, "marketplace.html"),
};

/** Site statique : fichiers à la racine (HTML, assets/, src/). */
export default defineConfig({
  server: {
    open: true,
  },
  build: {
    rollupOptions: {
      input: htmlEntries,
    },
  },
});
