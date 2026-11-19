# khoob

Multi-page static site for khoob (halal beauty & personal care). Hosted as-is on GitHub Pages; no build step needed.

- Pages: `index`, `shop`, four `product-*` pages, `our-promise`, `journal`, `contact`, `cart`
- Styles: `assets/css/site.css` (layout + motion), `assets/css/mughal.css` + `mughal-assets.css` (Mughal arches, carpet borders, jaali)
- Script: `assets/js/site.js` (animation system, cart, search, gallery)
- Regenerate pages from the product data: `node tools/build.js` (and `node tools/mughal.js` for pattern assets)

Palette: white `#FFFFFF`, charcoal `#414042`, rose `#E36386` (Pantone 7423C), blush `#F7B5CD` (Pantone 1895C).
