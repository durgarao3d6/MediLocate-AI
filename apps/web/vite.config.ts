import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [VitePWA({
    registerType: "autoUpdate",
    includeAssets: ["icon.svg"],
    manifest: {
      name: "MediLocate AI",
      short_name: "MediLocate",
      description: "Mobile-first pharmacy medicine locator",
      theme_color: "#117d67",
      background_color: "#f3f7fa",
      display: "standalone",
      start_url: "/",
      scope: "/",
      icons: [{src:"/icon.svg",sizes:"any",type:"image/svg+xml",purpose:"any"}]
    },
    workbox: {
      navigateFallback: "/index.html",
      runtimeCaching: []
    }
  })]
});
