import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'shopify-proxy',
      configureServer(server) {
        server.middlewares.use('/api/shopify', (req, res) => {
          const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?') + 1) : ''
          const params = new URLSearchParams(qs)
          const domain = params.get('domain')
          if (!domain) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Missing domain' }))
            return
          }
          const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
          const page = params.get('page') || 1
          https.get(
            { hostname: cleanDomain, path: `/products.json?limit=250&page=${page}`, headers: { 'User-Agent': 'Mozilla/5.0' } },
            (upstream) => {
              res.statusCode = upstream.statusCode
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Access-Control-Allow-Origin', '*')
              upstream.pipe(res)
            }
          ).on('error', (err) => {
            res.statusCode = 502
            res.end(JSON.stringify({ error: err.message }))
          })
        })
      },
    },
  ],
  server: {
    proxy: {
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
        headers: {
          'anthropic-version': '2023-06-01',
        },
      },
    },
  },
})
