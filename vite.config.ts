import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import svgLoader from 'vite-svg-loader'
import { chatSsePlugin } from './src/views/chat/mock/chatSsePlugin'

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
    ],
    css: {
      lightningcss: {
        errorRecovery: true,
      },
    },
  }
})