import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  if (!env.VITE_STRIPE_SECRET_KEY) {
    console.warn("⚠️  VITE_STRIPE_SECRET_KEY est manquant ! Ajoutez-le dans un fichier .env");
  }
  return {
    plugins: [react()],
    define: {
      global: "window",
      "process.env": {}
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: "window",
        },
      },
    },
    server: {
      proxy: {
        '/api/stripe': {
          target: 'https://api.stripe.com/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/stripe/, ''),
          headers: {
            Authorization: `Bearer ${env.VITE_STRIPE_SECRET_KEY}`,
          },
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      commonjsOptions: {
        strictRequires: ['node_modules/aws-sdk/**/*.js'],
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['lucide-react']
          }
        }
      }
    }
  }
});