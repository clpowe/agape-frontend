// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import Icons from "unplugin-icons/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  // Every route is prerendered, so the deployed Worker is static assets only and
  // has no `/_image` endpoint. "compile" processes images at build time instead.
  adapter: cloudflare({ imageService: "compile" }),

  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Playfair Display",
      cssVariable: "--font-playfair",
    },
    {
      provider: fontProviders.fontsource(),
      name: "Noto Sans",
      cssVariable: "--font-noto",
    },
  ],

  vite: {
    plugins: [
      Icons({
        compiler: "astro",
      }),
    ],
  },
});
