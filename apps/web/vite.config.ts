import { defineConfig } from "vite";
import { resolve } from "node:path";
import { VitePWA } from "vite-plugin-pwa";

const base = process.env.GITHUB_ACTIONS === "true" ? "/MediLocate-AI/" : "/";

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        pilot: resolve(__dirname, "pilot.html")
      }
    }
  },
  plugins: [VitePWA({
    registerType: "autoUpdate",
    includeAssets: ["icon.svg"],
    manifest: {
      name: "MediLocate AI",
      short_name: "MediLocate",
      description: "Pharmacy rack location pilot",
      theme_color: "#117d67",
      background_color: "#f3f7fa",
      display: "standalone",
      start_url: base,
      scope: base,
      icons: [{src:"icon.svg",sizes:"any",type:"image/svg+xml",purpose:"any"}]
    },
    workbox: {
      navigateFallback: "index.html",
      navigateFallbackDenylist: [/\/pilot\.html$/],
      runtimeCaching: []
    }
  })]
});
