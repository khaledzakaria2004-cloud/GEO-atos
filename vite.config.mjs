import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tagger from "@dhiwise/component-tagger";

// https://vitejs.dev/config/
export default defineConfig({
  // This changes the out put dir from dist to build
  // comment this out if that isn't relevant for your project
  build: {
    outDir: "build",
    chunkSizeWarningLimit: 2000,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  plugins: [tsconfigPaths(), react(), tagger()],
  server: {
    // Allow overriding port via environment variables for local development.
    // Use VITE_PORT or PORT to change the dev server port without editing this file.
    port: Number(process.env.VITE_PORT || process.env.PORT) || 5173,
    host: "localhost",
    // Allow falling back to another port if the requested one is busy.
    strictPort: false,
    allowedHosts: ['.amazonaws.com', '.builtwithrocket.new', 'localhost']
  }
});