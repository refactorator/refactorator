export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  const { domain } = req.query
  if (!domain) return res.status(400).json({ error: 'Missing domain parameter' })

  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const page = req.query.page || 1
  const url = `https://${cleanDomain}/products.json?limit=250&page=${page}`

  let upstream
  try {
    upstream = await fetch(url)
  } catch (err) {
    return res.status(502).json({ error: `Could not reach ${cleanDomain}` })
  }

  const body = await upstream.text()
  res.status(upstream.status).setHeader('Content-Type', 'application/json').end(body)
}
