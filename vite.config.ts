import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    minify: "esbuild",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return undefined;
          // Only split libs that do NOT depend on React at module-init time.
          // Splitting React-dependent libs (radix, router, tanstack, framer-motion, recharts)
          // into separate chunks can cause `createContext` errors when those chunks
          // evaluate before the React chunk is ready.
          if (id.includes("leaflet")) return "vendor-leaflet";
          if (id.includes("@supabase")) return "vendor-supabase";
          // Everything else (react, react-dom, radix, router, query, motion, charts, icons)
          // stays in the default vendor chunk so module init order is guaranteed.
          return "vendor";
        },
      },
    },
  },
}));
