import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.medilocate.ai",
  appName: "MediLocate AI",
  webDir: "dist",
  bundledWebRuntime: false,
  android: { allowMixedContent: false }
};

export default config;
