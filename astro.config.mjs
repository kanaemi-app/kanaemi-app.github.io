// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

const site = "https://kanaemi-app.github.io";

export default defineConfig({
  site,
  integrations: [
    starlight({
      title: "Kanaemi",
      description: "どの OS でも同じように使える、SKK 式の日本語入力",
      defaultLocale: "root",
      locales: { root: { label: "日本語", lang: "ja" } },
      logo: {
        light: "./public/logo/kanaemi-logo-horizontal.svg",
        dark: "./public/logo/kanaemi-logo-horizontal-dark.svg",
        replacesTitle: true,
      },
      favicon: "/favicon.svg",
      head: [
        { tag: "link", attrs: { rel: "apple-touch-icon", href: "/apple-touch-icon.png" } },
        { tag: "meta", attrs: { property: "og:image", content: `${site}/og.png` } },
        { tag: "meta", attrs: { name: "twitter:card", content: "summary_large_image" } },
      ],
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/kanaemi-app/kanaemi" },
      ],
      editLink: {
        baseUrl: "https://github.com/kanaemi-app/kanaemi-app.github.io/edit/main/",
      },
      customCss: ["./src/styles/fonts.css", "./src/styles/starlight.css"],
      sidebar: [
        {
          label: "はじめる",
          items: [
            { label: "Kanaemi とは", slug: "docs" },
            { label: "インストール", slug: "docs/install" },
            { label: "辞書を入れる", slug: "docs/dictionaries" },
          ],
        },
        {
          label: "打ち方",
          items: [
            { label: "モード", slug: "docs/usage/modes" },
            { label: "読みと変換", slug: "docs/usage/convert" },
            { label: "送り仮名", slug: "docs/usage/okurigana" },
            { label: "候補を選ぶ", slug: "docs/usage/candidates" },
            { label: "語を登録する", slug: "docs/usage/register" },
            { label: "数を含む語", slug: "docs/usage/numbers" },
          ],
        },
        {
          label: "設定",
          items: [
            { label: "設定のフォルダ", slug: "docs/settings/folder" },
            { label: "設定ファイル", slug: "docs/settings/config" },
            { label: "キーバインド", slug: "docs/settings/keys" },
            { label: "ローマ字の表", slug: "docs/settings/romaji" },
            { label: "辞書の一覧", slug: "docs/settings/dictionaries" },
            { label: "設定アプリ", slug: "docs/settings/app" },
          ],
        },
        {
          label: "ほかのプログラムから",
          items: [
            { label: "外からの操作", slug: "docs/integrations/control" },
            { label: "Vim・Neovim", slug: "docs/integrations/vim" },
          ],
        },
        {
          label: "リファレンス",
          items: [
            { label: "機能", slug: "docs/reference/functions" },
            { label: "既定のキー", slug: "docs/reference/default-keys" },
            { label: "テキストの辞書の形式", slug: "docs/reference/text-dictionary" },
            { label: "ローマ字の表の形式", slug: "docs/reference/romaji-table" },
          ],
        },
        {
          label: "そのほか",
          items: [
            { label: "考え方", slug: "docs/concept" },
            { label: "困ったとき", slug: "docs/troubleshooting" },
          ],
        },
      ],
    }),
  ],
});
