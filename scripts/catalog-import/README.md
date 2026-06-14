# Catalog Import Notes

This folder is reserved for the future CNFans UK catalog import flow.

Planned process:

1. Collect a product JSON payload from an approved source.
2. Process product images into web-ready `.webp` files.
3. Upload images to R2 under `products/{product_code}/{position}.webp`.
4. Write product, image and option rows into D1.
5. Validate the result through the Worker API.
6. Let the frontend read from the API when the catalog is ready.

Do not place real credentials, API keys, R2 keys or private source data in this folder.

