import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // We use process.cwd() to be explicit.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    base: './', // Ensures assets are loaded correctly if deployed to a subpath or offline filesystem
    define: {
      // Expose the API Key to the client-side code securely during build time.
      // Priority: VITE_API_KEY (from .env or Vercel env vars) -> process.env.API_KEY (system fallback)
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || process.env.API_KEY),
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false, // Disable source maps for production to save space
    },
    server: {
      host: true // Allow network access for local mobile testing
    }
  };
});