import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? "https://glimkin.pages.dev",
  output: "static",
  integrations: [sitemap()],
});
