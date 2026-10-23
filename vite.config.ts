import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import svgLoader from 'vite-svg-loader'
import { chatSsePlugin } from './src/views/chat/mock/chatSsePlugin'

/**
 * GitHub Pages only serves files that exist on disk. History-mode routes such as
 * `/chat` therefore 404 unless 404.html is a copy of the SPA shell.
 */
function githubPagesSpaFallback(): Plugin {
  let outDir = 'dist'

  return {
    name: 'github-pages-spa-fallback',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const indexHtml = resolve(outDir, 'index.html')
      if (!existsSync(indexHtml)) return
      copyFileSync(indexHtml, resolve(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: process.env.BASE_PATH || '/',
    plugins: [
      vue(),
      svgLoader(),
      chatSsePlugin({
        apiKey: env.DEEPSEEK_API_KEY || undefined,
        model: env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
      }),
      githubPagesSpaFallback(),
    ],
    css: {
      lightningcss: {
        errorRecovery: true,
      },
    },
  }
})