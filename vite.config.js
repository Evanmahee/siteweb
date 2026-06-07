import { defineConfig } from "vite";

/** Site statique : fichiers à la racine (HTML, assets/, src/). */
export default defineConfig({
  server: {
    open: true,
  },
});
