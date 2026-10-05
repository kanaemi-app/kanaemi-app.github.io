---
title: 設定ファイル
description: config.toml の書き方と、書ける設定。
---

設定は、[設定のフォルダ](/docs/settings/folder/) の `config.toml` に書きます。[設定アプリ](/docs/settings/app/) で変えることも、エディタで直接書くこともできます。

Kanaemi は設定なしで使えるように作ってあります。変えたいところだけ書いてください。

## ひな形

`config.toml` がなければ、Kanaemi がひな形を作ります。ひな形には、書ける設定がすべて既定値のままコメントとして入っています。行頭の `#` を外した設定だけが有効になります。

```toml
# ABC モードとかなモードが切り替わったとき、カーソルの近くに「かな」「ABC」を短く出すか。
#mode_indicator = true
```

- 書いていない設定は、既定値になります。
- 読めない設定は飛ばして既定値を使い、そのことをログに残します。
- ファイル全体が TOML として読めなければ、すべて既定値を使います。

## 書ける設定

| 設定 | 既定値 | 内容 |
| --- | --- | --- |
| `dictionaries` | （書かない） | 使う辞書の一覧。[辞書の一覧](/docs/settings/dictionaries/) |
| `mode_indicator` | `true` | モードが切り替わったとき、カーソルの近くに「かな」「ABC」を出すか |
| `[marks]` | 下を見る | 未確定文字列の印 |
| `[romaji] tables` | `["full-width", "hepburn", "kunrei", "input-aids", "z-symbols"]` | 重ねるローマ字の表。[ローマ字の表](/docs/settings/romaji/) |
| `[control] port` | （書かない） | 外からの操作を待つポート。[外からの操作](/docs/integrations/control/) |
| `[keys] pass_while_composing` | `[]` | ここに書いた修飾キー（`"cmd"`・`"ctrl"`・`"alt"`）付きで割り当てのないキーを、入力中は確定してからアプリに渡す |
| `[keys] tap_timeout_ms` | `300` | 単独押しとみなす、押してから離すまでの長さ（ミリ秒） |
| `[keys.*]` | [既定のキー](/docs/reference/default-keys/) | キーバインド。[キーバインド](/docs/settings/keys/) |

## 未確定文字列の印

Kanaemi は、今の場面を色や下線ではなく、印の文字で示します。どの印も好きな文字に変えられます。印は空でない文字列で書き、改行とタブは含められません。

```toml
[marks]
reading = "›"        # 読みの前
candidate = "»"      # 候補の前
okurigana = "*"      # 送り仮名の始まり
registration = " « " # 読みと登録する文字列の間
cursor = "|"         # 読みの途中のカーソル（末尾のときは出さない）
```

| 印 | 例 |
| --- | --- |
| 読み | <span class="preedit">›かんじ</span> |
| 候補 | <span class="preedit is-candidate">»漢字</span> |
| 送り仮名の始まり | <span class="preedit">›か*く</span> |
| 登録 | <span class="preedit">»きしゃ « 記者</span> |
| カーソル | <span class="preedit">›かん\|じ</span> |

## 例

次の例では、何も打っていないときのモードの切り替えを、左右の Shift から <kbd>Ctrl</kbd>＋<kbd>J</kbd>（かなモードへ）と <kbd>Ctrl</kbd>＋<kbd>L</kbd>（ABC モードへ）に替えています。SKK に近い割り当てです。

```toml
[keys.abc]
"right-shift#tap" = "@none"
"ctrl+j" = "@kana"

[keys.kana]
"left-shift#tap" = "@none"
"ctrl+l" = "@abc"
```

キーの書き方は [キーバインド](/docs/settings/keys/) にあります。
