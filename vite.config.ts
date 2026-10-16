import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Fontsource ships Cyrillic, Greek and Vietnamese subsets too; the page only sets Latin text
 * (Greek letters are math and go through KaTeX), so keep the latin + latin-ext faces.
 */
function trimFonts(): Plugin {
  return {
    name: 'trim-fonts',
    enforce: 'pre',
    transform(code, id) {
      if (/@fontsource-variable\/.+\.css$/.test(id)) {
        return code.replace(
          /\/\*[^*]*-(?:cyrillic-ext|cyrillic|greek-ext|greek|vietnamese)-[^*]*\*\/\s*@font-face\s*\{[^}]*\}/g,
          ''
        );
      }
      // KaTeX lists woff2, woff and ttf for every face; every browser we target reads woff2
      if (/katex(\.min)?\.css$/.test(id)) {
        return code.replace(/,\s*url\([^)]*\.woff\)\s*format\("woff"\)/g, '').replace(/,\s*url\([^)]*\.ttf\)\s*format\("truetype"\)/g, '');
      }
      return null;
    },
  };
}

/** single-file build: inline the favicon too, so the HTML has no external references at all */
function inlineFavicon(): Plugin {
  return {
    name: 'inline-favicon',
    transformIndexHtml(html) {
      const png = readFileSync(fileURLToPath(new URL('./public/favicon.png', import.meta.url))).toString('base64');
      return html
        .replace('href="./favicon.png"', `href="data:image/png;base64,${png}"`)
        .replace(/\s*<link rel="apple-touch-icon"[^>]*>/, '')
        .replace(/\s*<meta (property|name)="(og|twitter):image(:\w+)?"[^>]*>/g, '');
    },
  };
}

// `npm run build`        -> dist/         (static site for GitHub Pages or any static host)
// `npm run build:single` -> dist-single/  (one self-contained index.html that opens by double-click)
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    // relative asset paths: the same build works at user.github.io/<repo>/ and at a custom domain
    base: './',
    plugins: [trimFonts(), react(), tailwindcss(), ...(single ? [inlineFavicon(), viteSingleFile({ removeViteModuleLoader: true })] : [])],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
      dedupe: ['react', 'react-dom'],
    },
    // pre-bundle everything up front so the dev server never re-optimises mid-session
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'motion/react',
        'gsap',
        'gsap/ScrollTrigger',
        'gsap/SplitText',
        '@gsap/react',
        '@hugeicons/react',
        '@hugeicons/core-free-icons',
        'katex',
        'ogl',
      ],
    },
    server: { port: 5181 },
    build: single
      ? { outDir: 'dist-single', assetsInlineLimit: () => true, cssCodeSplit: false, chunkSizeWarningLimit: 100000, copyPublicDir: false }
      : { outDir: 'dist', chunkSizeWarningLimit: 4000 },
  };
});
