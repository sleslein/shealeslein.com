import { defineConfig } from "astro/config";
import node from "@astrojs/node";

export default defineConfig({
  site: "https://shealeslein.com",
  build: {
    format: "directory",
  },
  output: "static",
  adapter: node({ mode: "standalone" }),
  security: { checkOrigin: false },
  markdown: {
    shikiConfig: {
      theme: "github-light",
      wrap: true,
    },
  },
  integrations: [],
});
