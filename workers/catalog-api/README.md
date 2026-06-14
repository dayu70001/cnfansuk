# CNFans UK Catalog API

Cloudflare Worker API for the future CNFans UK product catalog.

## Resources

- Worker: `cnfansuk-catalog-api`
- D1 database: `cnfansuk-db`
- D1 binding: `DB`
- R2 bucket: `cnfansuk-products`
- R2 binding: `PRODUCT_IMAGES`
- Public image host: `https://img.cnfans.co.uk`

## Endpoints

- `GET /health`
- `GET /catalog`
- `GET /catalog?category=outerwear&limit=24&offset=0`
- `GET /product/:slug`
- `GET /product-code/:product_code`
- `GET /filters`

Only active products are returned by catalog endpoints. Empty catalog results return empty arrays.

## Image Keys

R2 product images should use:

```text
products/{product_code}/{position}.webp
```

Example:

```text
products/CNF-APP-0001/01.webp
```

The public URL is:

```text
https://img.cnfans.co.uk/products/CNF-APP-0001/01.webp
```

## Deploy

```bash
npx wrangler d1 migrations apply cnfansuk-db --remote
npx wrangler deploy
```

