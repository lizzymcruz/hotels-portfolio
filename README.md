# hotels.lizzymcruz.com

Portfolio site for Lizzy Cruz's hotel website service, in English and Spanish.

- `src/content.js`: all the text (EN + ES), the three case studies, prices and FAQ. Edit here.
- `src/css/site.css`, `src/js/site.js`: styles and the small scripts (menu, commission calculator, free-review form).
- `src/shots/`: screenshots of the three demo sites. Casa Lumbre's are transparent overlays with the real Unsplash photos placed underneath (`lu-meta.json`).
- `build.js`: writes the site to `public/`.

## Build

```
node build.js
```

No dependencies. On Cloudflare Pages: build command `node build.js`, output directory `public`.

## To fill in

- WhatsApp: add your `https://wa.me/...` link to `SITE.whatsapp` in `src/content.js` and it appears in the footer.
- The free-review form opens the visitor's email app addressed to hello@lizzymcruz.com (no server needed).
