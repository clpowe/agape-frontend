import { defineConfig } from "vite-plus";
import Icons from "unplugin-icons/vite";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  plugins: [
    Icons({
      compiler: "astro",
    }),
  ],
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
});
