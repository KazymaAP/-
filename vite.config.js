import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { visualizer } from 'rollup-plugin-visualizer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXCLUDED_DIR_NAMES = new Set(['server', 'db', 'src', 'node_modules']);

function copyStaticDemosPlugin() {
  return {
    name: 'copy-static-demo-dirs',
    closeBundle() {
      const dirsToCopy = ['cases', 'miniapps'];
      for (const dir of dirsToCopy) {
        const src = path.resolve(__dirname, dir);
        const dest = path.resolve(__dirname, 'dist', dir);
        if (fs.existsSync(src)) {
          fs.cpSync(src, dest, {
            recursive: true,
            filter: (srcPath) => {
              const base = path.basename(srcPath);
              return !EXCLUDED_DIR_NAMES.has(base);
            },
          });
          console.log(`[copy-static-demo-dirs] copied ${dir}/ -> dist/${dir}/ (excluded: ${[...EXCLUDED_DIR_NAMES].join(', ')})`);
        } else {
          console.warn(`[copy-static-demo-dirs] WARNING: ${dir}/ not found, skipped`);
        }
      }
    },
  };
}

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isReport = mode === 'report';
  const isProduction = command === 'build' && mode === 'production';

  return {
    root: '.',
    publicDir: 'public',
    plugins: [
      copyStaticDemosPlugin(),
      isReport && visualizer({
        filename: 'stats.html',
        open: false,
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
      }),
    ].filter(Boolean),
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version ?? '1.0.0'),
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      minify: isProduction ? 'esbuild' : false,
      cssCodeSplit: true,
      sourcemap: true,
      reportCompressedSize: true,
      chunkSizeWarningLimit: 300,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['framer-motion', 'lucide-react'],
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(css)$/.test(assetInfo.name)) {
              return `assets/css/[name]-[hash].${ext}`;
            }
            if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(assetInfo.name)) {
              return `assets/images/[name]-[hash].${ext}`;
            }
            if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
              return `assets/fonts/[name]-[hash].${ext}`;
            }
            return `assets/[name]-[hash].${ext}`;
          },
        },
      },
    },
    server: {
      port: 5173,
      host: true,
      open: true,
      cors: true,
    },
    preview: {
      port: 4173,
      host: true,
    },
    esbuild: {
      target: 'es2020',
      treeShaking: true,
      legalComments: 'none',
    },
  };
});