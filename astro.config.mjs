import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";

// Static output. The only server code is server/index.js, which serves
// this build and the single /send endpoint.
export default defineConfig({
  output: "static",
  integrations: [preact()],
  site: process.env.PUBLIC_SITE_URL || "https://yearwellbuilt.com",
  build: { inlineStylesheets: "auto" },
  devToolbar: { enabled: false },
  vite: {
    // Keep islands small and predictable.
    build: { assetsInlineLimit: 2048 },
  },
});
