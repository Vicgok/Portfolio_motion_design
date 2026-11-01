import { defineConfig } from "vite";
export default defineConfig({
  build: {
    rollupOptions: {
      output: { manualChunks: { motion: ["gsap", "gsap/ScrollTrigger"] } },
    },
  },
  optimizeDeps: { entries: ["index.html"] },
  server: {
    port: 3000,
    open: true,
  },
});
