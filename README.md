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
├── pages/
│   ├── index.astro            # landing page
│   └── docs/releases.astro    # release history, built from src/data/releases.json
├── components/
│   ├── landing/Demo.astro     # the typing demo in the hero
│   ├── ThemedFigure.astro     # light/dark illustration pair for the docs
│   ├── Screencast.astro       # a short recording of Kanaemi at work on macOS
│   ├── DefaultKeys.astro      # default key table, built from src/data/config.toml
│   └── DictionaryDownloads.astro # download table of the official dictionaries
├── content/docs/docs/         # the documentation, served under /docs/
├── data/config.toml           # Kanaemi's settings template, copied from the kanaemi repository
├── lib/
│   ├── demo-engine.ts         # a small imitation of Kanaemi's typing, for the demo
│   ├── default-keys.ts        # reads the default keys out of the template
│   ├── installers.ts          # names the installers for the download lists
│   └── releases.ts            # renders the release notes
└── styles/                    # fonts, Starlight theme, landing page
public/
├── guide/                     # usage illustrations (generated)
├── screencasts/               # recordings of Kanaemi on macOS (recorded)
└── logo/                      # brand logos, from kanaemi-brand
scripts/
├── guide/                     # draws public/guide
├── screencast/                # records the scenes in it and cuts them into public/screencasts
├── sync-config.sh             # copies the settings template
├── fetch_dictionaries.py      # fetches the latest kanaemi-dict release (runs before dev and build)
├── fetch_installers.py        # reads the catalog of Kanaemi's latest release (runs before dev and build)
├── fetch_releases.py          # reads every release of Kanaemi and its notes (runs before dev and build)
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

The screencasts in `public/screencasts/` are recordings of Kanaemi itself. Each is played from a scene in `scripts/screencast/scenes/`, which lists the keys to send and a caption for each step. When the behaviour a scene shows changes, record it again on a Mac, then cut the recordings into what the pages show:

```sh
just screencast                     # record every scene
just screencast convert             # record the named scenes
just screencast-publish             # cut every recording into public/screencasts
just screencast-publish convert     # cut the named ones
```

Each scene is recorded with [CleanShot X](https://cleanshot.com) as a Studio project (`.cache/screencast/<name>.cleanshotvideo`, or `$SCREENCAST_PROJECTS`), kept so the recording can still be edited. `just screencast-publish` cuts the recording in it from just after the first caption to a moment after the last change, without the title bar and the marks CleanShot draws on the corners, and takes the poster from its last moment.

A scene takes over the keyboard and the screen while it plays, and switches the input source to Kanaemi. If a window of another app, such as a dialog or a notification, shows over the stage while a scene plays, the take is thrown away and the recording stops. The candidates come from the settings folder Kanaemi reads, so record with a folder that holds only the official dictionaries, not your own words and history. Kanaemi needs to be the release the pages describe.

## The official dictionaries

The site serves the dictionaries of the latest [kanaemi-dict](https://github.com/kanaemi-app/kanaemi-dict) release itself. `scripts/fetch_dictionaries.py` runs before `npm run dev` and `npm run build`: it reads the release's catalog (`index.json`, the one the settings app of Kanaemi reads), downloads the zips into `public/dictionaries/`, checks their files against the catalog's SHA-256, and describes them, with their Japanese labels, in `src/data/dictionaries.json`. Both are generated and not committed. Without the network, the files fetched before are used; set `KANAEMI_DICT_RELEASE` to fetch from another release URL.

## The installers

`scripts/fetch_installers.py` reads the catalog (`index.json`) of Kanaemi's latest release into `src/data/installers.json`, from which the landing page and `/docs/install/` link each installer directly on GitHub, named by OS and CPU, and on Linux by the input method framework (IBus or Fcitx5). The installers themselves are not copied. A release without a catalog counts as none, and the pages then say no release is out yet. It reads catalog formats 1 and 2; format 1 has no framework, and its Linux packages are IBus ones.

## The release history

`scripts/fetch_releases.py` reads every published release of Kanaemi from the GitHub API into `src/data/releases.json`, from which `/docs/releases/` lists them with their notes as written on GitHub. A patch release is folded into its X.Y.0 release. The notes are rendered at build time with raw HTML dropped. The file is generated and not committed; without the network, the history read before is used. Set `GITHUB_TOKEN` to raise the API's rate limit; the deploy workflow passes its own.

The releases of Kanaemi and kanaemi-dict run the deploy workflow (`workflow_dispatch`) once their files are attached, so the site reads the new catalogs right away.

## Writing the documentation

- Write in Japanese, in the plain style of Kanaemi's own documents: short sentences, everyday words, the function names (`@next`) only where the reader writes them.
- Link between pages with absolute paths (`/docs/usage/convert/`). `just check` fails on a link to a page or a heading that does not exist.
- Illustrations come in a light and a dark pair; use `ThemedFigure` so the page shows the one matching the site's theme.
