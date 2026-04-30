const MAX_PAGES = 4 // up to 1000 products

export async function fetchShopifyStore(domain) {
  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')

  const fetchPage = async (page) => {
    const url = `/api/shopify?domain=${encodeURIComponent(cleanDomain)}&page=${page}`
    let res
    try {
      res = await fetch(url)
    } catch {
      throw new Error(`Could not reach ${cleanDomain}. Check the domain and try again.`)
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error('This store is password-protected and cannot be accessed publicly.')
    }
    if (!res.ok) {
      throw new Error(`Store returned an error (${res.status}). Make sure this is a valid Shopify store URL.`)
    }
    const json = await res.json()
    if (!json.products) {
      throw new Error('Not a Shopify store, or the store has no public products.')
    }
    return json.products
  }

  const pages = await Promise.all(
    Array.from({ length: MAX_PAGES }, (_, i) => fetchPage(i + 1))
  )

  let allProducts = []
  for (const page of pages) {
    allProducts = [...allProducts, ...page]
    if (page.length < 250) break
  }

  if (allProducts.length === 0) {
    throw new Error('Not a Shopify store, or the store has no public products.')
  }

  const storeName = deriveStoreName(cleanDomain, allProducts)
  return mapProducts(allProducts, storeName)
}

function deriveStoreName(domain, products) {
  let vendor = products[0]?.vendor
  if (vendor && vendor.length > 0 && vendor.toLowerCase() !== 'shopify') {
    vendor = vendor.split(/\s*[|\/]\s*/)[0].trim()
    if (vendor.length > 0) return vendor
  }

  return domain
    .replace(/\.myshopify\.com$/, '')
    .replace(/^www\./, '')
    .replace(/\..+$/, '')
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function mapProducts(shopifyProducts, storeName) {
  const products = shopifyProducts.map((node) => {
    const variants = node.variants || []
    const prices = variants.map((v) => parseFloat(v.price)).filter(Boolean)
    const price = prices.length ? Math.min(...prices) : 0

    const compareAtPrices = variants
      .filter((v) => v.compare_at_price && parseFloat(v.compare_at_price) > 0)
      .map((v) => parseFloat(v.compare_at_price))
    const originalPrice = compareAtPrices.length ? Math.max(...compareAtPrices) : null
    const isOnSale = originalPrice && originalPrice > price

    const sizeOption = (node.options || []).find(
      (o) => o.name.toLowerCase() === 'size' || o.name.toLowerCase() === 'sizes'
    )
    const sizes = sizeOption
      ? sizeOption.values
      : variants[0]?.title !== 'Default Title'
        ? variants.map((v) => v.title)
        : ['ONE SIZE']

    const stock = {}
    if (sizeOption) {
      variants.forEach((v) => {
        stock[v.option1] = v.inventory_quantity != null
          ? v.inventory_quantity
          : v.available ? 10 : 0
      })
    } else {
      const key = variants[0]?.title !== 'Default Title' ? variants[0]?.title : 'ONE SIZE'
      stock[key || 'ONE SIZE'] = variants[0]?.available ? 10 : 0
    }

    const shopifyTags = Array.isArray(node.tags)
      ? node.tags.map((t) => t.trim().toLowerCase())
      : node.tags
        ? node.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
        : []

    const tags = []
    if (isOnSale) tags.push('sale')
    if (shopifyTags.some((t) => t === 'new' || t === 'new-arrival' || t === 'new-arrivals')) tags.push('new')
    if (shopifyTags.some((t) => ['top-seller', 'bestseller', 'best-seller', 'top seller', 'best seller'].includes(t))) tags.push('top-seller')

    return {
      id: String(node.id),
      name: node.title,
      category: inferCategory(node.product_type, shopifyTags),
      gender: inferGender(shopifyTags, node.product_type),
      price: Math.round(price * 100) / 100,
      originalPrice: isOnSale ? Math.round(originalPrice * 100) / 100 : null,
      sizes: sizes.length ? sizes : ['ONE SIZE'],
      stock,
      tags,
      brand: node.vendor || storeName,
      sku: node.handle,
      imageUrl: node.images?.[0]?.src || null,
    }
  })

  function getProductImage(product, w = 400, h = 500) {
    if (product.imageUrl) return product.imageUrl
    const seed = product.id.replace(/\D/g, '').slice(-8) || '1'
    return `https://picsum.photos/seed/${seed}/${w}/${h}`
  }

  const storeInfo = {
    name: storeName,
    location: '',
    loyaltyPoints: 0,
    loyaltyTier: 'Member',
    nextTier: 'Gold',
    pointsToNextTier: 1000,
    recentOrders: [],
    savedBrands: [],
    savedSizes: {},
  }

  return { products, coupons: [], storeInfo, storeName, getProductImage }
}

function inferCategory(productType, tags) {
  const str = [productType, ...tags].join(' ').toLowerCase()
  if (/\b(tops|shirts?|tees?|blouse|sweater|hoodie|knitwear|jumper|tanks?|crop|sports?\s*bras?|bralette|pullover|sweatshirt|one.piece|bodysuit|romper|playsuit)\b/.test(str)) return 'tops'
  if (/\b(pants?|jeans?|trousers?|shorts|leggings?|chinos?|joggers?|denim)\b/.test(str)) return 'pants'
  if (/\b(dresses?|skirts?)\b/.test(str)) return 'dresses'
  if (/\b(coats?|outerwear|jackets?|parka|bomber|vest|windbreaker|anorak)\b/.test(str)) return 'outerwear'
  if (/\b(shoes?|sneakers?|boots?|heels?|sandals?|loafers?|mules?|oxford|footwear|trainers?)\b/.test(str)) return 'shoes'
  if (/\b(kids?|children|baby|babies|toddler|infant)\b/.test(str)) return 'kids'
  if (/\b(accessories|bags?|belts?|hats?|caps?|scarf|scarves|jewelry|jewellery|watch|wallets?|totes?|purses?|gloves?)\b/.test(str)) return 'accessories'
  return productType?.toLowerCase() || 'other'
}

function inferGender(tags, productType) {
  const str = [productType, ...tags].join(' ').toLowerCase()
  if (/\b(kids?|child(ren)?|baby|babies|toddler|infant|girls?|boys?)/.test(str)) return 'kids'
  if (/\b(unisex|gender.neutral|gender.free|everyone)/.test(str)) return 'unisex'
  if (/\b(womens?|woman|female|ladies|femme|girl|her|hers)/.test(str)) return 'women'
  if (/\b(mens?|man|male|guy|homme|his|him)/.test(str)) return 'men'
  return 'unisex'
}
