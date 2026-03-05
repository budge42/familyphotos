# Family Photo Gallery

A clean, simple static website for displaying family photos.

## Quick start

1. Open `index.html` in a browser.
2. Use **Select photos** to preview photos from your phone/computer for the current session.

## Add photos permanently

1. Copy your image files into `photos/`.
2. Run:

```bash
node scripts/generate-photos-manifest.mjs
```

This refreshes `photos/photos.js` from every image in `photos/`.

Manual entries are still supported if you want custom captions:

Example entry:

```js
{ src: "photos/beach-day.jpg", caption: "Beach day", alt: "Family at the beach" }
```

`alt` is optional but recommended.

`photos/photos.json` is also supported as a fallback.

## GitHub Pages

1. Commit and push this repo to GitHub.
2. In GitHub repo Settings -> Pages, set deployment to your branch root.
3. Your static gallery will publish with all files in `photos/` listed by `photos/photos.js`.
