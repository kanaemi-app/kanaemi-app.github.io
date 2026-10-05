# Kanaemi Site

The landing page and the user documentation for [Kanaemi](https://github.com/kanaemi-app/kanaemi), published at [kanaemi-app.github.io](https://kanaemi-app.github.io).

## Tech stack

- [Astro](https://astro.build) with [Starlight](https://starlight.astro.build) for the documentation: sidebar, full-text search (Pagefind), light and dark themes and the table of contents come with it.
- The landing page (`src/pages/index.astro`) is a plain Astro page with its own styles, outside Starlight.
- Fonts are the brand's faces, Quicksand and Zen Maru Gothic, self-hosted through Fontsource.
- Deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

## Development

With Nix, `nix develop` gives Node.js, just, Python and resvg. Without it, Node.js 24 is enough for everything but redrawing the illustrations.

```sh
just install   # npm install
just dev       # dev server with hot reload
just check     # unit tests, type check, build, link check
just preview   # serve dist/
```

## Layout

```
src/
├── pages/index.astro          # landing page
├── components/
│   ├── landing/Demo.astro     # the typing demo in the hero
│   ├── ThemedFigure.astro     # light/dark illustration pair for the docs
│   └── DefaultKeys.astro      # default key table, built from src/data/config.toml
├── content/docs/docs/         # the documentation, served under /docs/
├── data/config.toml           # Kanaemi's settings template, copied from the kanaemi repository
├── lib/
│   ├── demo-engine.ts         # a small imitation of Kanaemi's typing, for the demo
│   └── default-keys.ts        # reads the default keys out of the template
└── styles/                    # fonts, Starlight theme, landing page
public/
├── guide/                     # usage illustrations (generated)
└── logo/                      # brand logos, from kanaemi-brand
scripts/
├── guide/                     # draws public/guide
├── sync-config.sh             # copies the settings template
└── check-links.py             # checks every internal link and #fragment in dist/
```

## Keeping up with Kanaemi

The documentation describes Kanaemi's behaviour in the words of a user; its source of truth is `docs/spec/` in the kanaemi repository. When the behaviour changes there, change the page that describes it here.

The default keys are not written by hand. `src/data/config.toml` is a copy of Kanaemi's settings template, and `/docs/reference/default-keys/` is built from it. When the defaults change:

```sh
just sync-config            # from ../kanaemi
just sync-config ~/src/kanaemi
```

The usage illustrations in `public/guide/` show the default keys too. Change `scripts/guide/gen.py` and redraw them with `just guide`.

## Writing the documentation

- Write in Japanese, in the plain style of Kanaemi's own documents: short sentences, everyday words, the function names (`@next`) only where the reader writes them.
- Link between pages with absolute paths (`/docs/usage/convert/`). `just check` fails on a link to a page or a heading that does not exist.
- Illustrations come in a light and a dark pair; use `ThemedFigure` so the page shows the one matching the site's theme.
