# Kanaemi Site

[Kanaemi](https://github.com/kanaemi-app/kanaemi) のランディングページと利用者向けのドキュメント。[kanaemi-app.github.io](https://kanaemi-app.github.io) で公開している。

## 使っているもの

- ドキュメントは [Astro](https://astro.build) と [Starlight](https://starlight.astro.build) で作る。サイドバー、全文検索（Pagefind）、ライトとダークのテーマ、目次は Starlight に付いてくる。
- ランディングページ（`src/pages/index.astro`）は Starlight の外にある、独自のスタイルを持つふつうの Astro のページ。
- フォントはブランドの書体、Quicksand と Zen Maru Gothic。Fontsource を通して、このサイトから配る。
- `main` に push するたびに、`.github/workflows/deploy.yml` が GitHub Pages に公開する。

## 開発

Nix があれば、`nix develop` で Node.js、just、Python、resvg がそろう。なければ、図を描き直すほかは Node.js 24 だけで足りる。

```sh
just install   # npm install
just dev       # 書き換えをすぐ反映する開発サーバー
just check     # 単体テスト、型チェック、ビルド、リンクチェック
just preview   # dist/ を配る
```

## 構成

```
src/
├── pages/
│   ├── index.astro            # ランディングページ
│   └── docs/releases.astro    # リリースの履歴。src/data/releases.json から作る
├── components/
│   ├── landing/Demo.astro     # 冒頭の打鍵のデモ
│   ├── ThemedFigure.astro     # ドキュメントの図（ライトとダークの組）
│   ├── Screencast.astro       # macOS で Kanaemi を使っているところの短い動画
│   ├── Screenshot.astro       # 設定アプリの画面（ライトとダークの組）
│   ├── DefaultKeys.astro      # 既定のキーの表。src/data/config.toml から作る
│   └── DictionaryDownloads.astro # 公式辞書のダウンロードの表
├── content/docs/docs/         # ドキュメント。/docs/ の下に出る
├── data/config.toml           # Kanaemi の設定のテンプレート。kanaemi のリポジトリから写す
├── lib/
│   ├── demo-engine.ts         # デモのための、Kanaemi の打ち方の小さな模倣
│   ├── default-keys.ts        # テンプレートから既定のキーを読む
│   ├── installers.ts          # ダウンロードの一覧に出すインストーラーの名前を付ける
│   └── releases.ts            # リリースノートを描く
└── styles/                    # フォント、Starlight のテーマ、ランディングページ
public/
├── guide/                     # 使い方の図（描いたもの）
├── screencasts/               # macOS の Kanaemi の動画（撮ったもの）
├── screenshots/               # macOS の設定アプリの画面（撮ったもの）
└── logo/                      # ブランドのロゴ。kanaemi-brand から
scripts/
├── guide/                     # public/guide を描く
├── screencast/                # 中の場面を撮り、public/screencasts に切り出す
├── sync-config.sh             # 設定のテンプレートを写す
├── fetch_dictionaries.py      # kanaemi-dict の最新のリリースを取ってくる（dev と build の前に動く）
├── fetch_installers.py        # Kanaemi の最新のリリースの目録を読む（dev と build の前に動く）
├── fetch_releases.py          # Kanaemi のすべてのリリースとそのノートを読む（dev と build の前に動く）
└── check-links.py             # dist/ の中のリンクと #fragment をすべて確かめる
```

## Kanaemi に合わせる

ドキュメントは、Kanaemi のふるまいを利用者の言葉で書く。ふるまいのよりどころは、kanaemi のリポジトリの `docs/spec/`。そこでふるまいが変わったら、それを説明しているこちらのページを直す。

既定のキーは手で書かない。`src/data/config.toml` は Kanaemi の設定のテンプレートの写しで、`/docs/reference/default-keys/` はそこから作る。既定が変わったら、写し直す。

```sh
just sync-config            # ../kanaemi から
just sync-config ~/src/kanaemi
```

`public/guide/` の使い方の図も既定のキーを描いている。`scripts/guide/gen.py` を直して、`just guide` で描き直す。

`public/screencasts/` の動画は、Kanaemi そのものを撮ったもの。どれも `scripts/screencast/scenes/` の場面を再生して撮る。場面には、送るキーと、段ごとの説明の文を書く。場面で見せているふるまいが変わったら、Mac で撮り直して、ページに出す動画に切り出す。

```sh
just screencast                     # すべての場面を撮る
just screencast convert             # 名前を挙げた場面だけ撮る
just screencast-publish             # すべての録画を public/screencasts に切り出す
just screencast-publish convert     # 名前を挙げたものだけ切り出す
```

場面は [CleanShot X](https://cleanshot.com) の Studio のプロジェクト（`.cache/screencast/<name>.cleanshotvideo`、または `$SCREENCAST_PROJECTS`）として撮る。録画をあとから編集できるように残しておく。`just screencast-publish` は、その中の録画を、最初の説明の文が出た直後から最後に画面が変わった少しあとまで切り出す。タイトルバーと、CleanShot が範囲の四隅に描く印は落とし、最後の場面をポスターの画像にする。

場面を再生しているあいだは、キーボードと画面を使い、入力ソースを Kanaemi に切り替える。ダイアログや通知のような、ほかのアプリのウインドウが舞台の上に出たら、その回は捨てて撮るのをやめる。候補は Kanaemi が読む設定のフォルダから出るので、公式の辞書だけを入れたフォルダで撮る。自分の語や履歴は入れない。Kanaemi は、ページが説明している版にしておく。

`public/screenshots/` の画像は、macOS の設定アプリの画面。どれも、その節が説明しているところだけに切り、`<name>.webp` と `<name>-dark.webp` の組にする。ページが説明している版の設定アプリを、公式の辞書といくつかのサンプルの語だけを入れた HOME で起動して撮り、自分のものが映らないようにする。「かなえみについて」の画面は設定のフォルダの場所が出るので、使わない。

## 公式の辞書

このサイトは、[kanaemi-dict](https://github.com/kanaemi-app/kanaemi-dict) の最新のリリースの辞書を自分で配る。`scripts/fetch_dictionaries.py` は `npm run dev` と `npm run build` の前に動き、リリースの目録（Kanaemi の設定アプリが読むのと同じ `index.json`）を読んで、zip を `public/dictionaries/` に落とす。ファイルを目録の SHA-256 で確かめ、日本語の名前と一緒に `src/data/dictionaries.json` に書く。どちらも作るもので、コミットしない。ネットワークがなければ、前に取ってきたものを使う。別のリリースの URL から取るときは、`KANAEMI_DICT_RELEASE` を決める。

## インストーラー

`scripts/fetch_installers.py` は、Kanaemi の最新のリリースの目録（`index.json`）を `src/data/installers.json` に読む。ランディングページと `/docs/install/` は、そこから各インストーラーへ GitHub のリンクを直接張る。名前は OS と CPU で、Linux では入力方式の仕組み（IBus か Fcitx5）でも付ける。インストーラーそのものは写さない。目録のないリリースはないものとして数え、そのときページはまだリリースがないと書く。目録の形式は 1 と 2 を読む。形式 1 には仕組みがなく、その Linux のパッケージは IBus のもの。

## リリースの履歴

`scripts/fetch_releases.py` は、公開した Kanaemi のすべてのリリースを GitHub の API から `src/data/releases.json` に読む。`/docs/releases/` は、そこから GitHub に書いたとおりのノートと一緒に一覧にする。パッチのリリースは、その X.Y.0 のリリースにまとめる。ノートはビルドのときに描き、生の HTML は落とす。このファイルも作るもので、コミットしない。ネットワークがなければ、前に読んだ履歴を使う。API の回数の上限を上げるには `GITHUB_TOKEN` を決める。デプロイのワークフローは自分のものを渡す。

Kanaemi と kanaemi-dict のリリースは、ファイルを付け終えるとデプロイのワークフロー（`workflow_dispatch`）を動かす。サイトは新しい目録をすぐに読む。

## ドキュメントを書く

- 日本語で、Kanaemi 自身の文書と同じ平らな書き方で書く。文は短く、ふだんの言葉で書く。機能の名前（`@next`）は、読み手がそれを書くところでだけ使う。
- ページのあいだは絶対パス（`/docs/usage/convert/`）でリンクする。ないページや見出しへのリンクがあると、`just check` が失敗する。
- 図はライトとダークの組で用意する。`ThemedFigure` を使い、サイトのテーマに合うほうを出す。設定アプリの画面も、`Screenshot` で同じようにする。
