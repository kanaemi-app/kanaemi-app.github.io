---
title: 設定のフォルダ
description: 設定・辞書・登録した語を置くフォルダの場所と中身。
---

Kanaemi の設定、辞書、登録した語は、すべて 1 つのフォルダに入っています。このフォルダを別のマシンにコピーすれば、同じ設定で使えます。

| OS | 場所 |
| --- | --- |
| macOS | `~/Library/Application Support/kanaemi/` |
| Windows | `%APPDATA%\kanaemi\` |
| Linux | `$XDG_CONFIG_HOME/kanaemi/`（なければ `~/.config/kanaemi/`） |

フォルダがなければ、Kanaemi が作ります。

## 中身

| ファイル | 中身 |
| --- | --- |
| `config.toml` | [設定ファイル](/docs/settings/config/) |
| `custom.tsv` | ユーザーカスタム辞書。[登録した語](/docs/usage/register/) と、出さないようにした語が入る |
| `dictionaries/` | [辞書](/docs/dictionaries/) のファイル。中にフォルダを作ってもよい |
| `romaji/` | 自分で書いた [ローマ字の表](/docs/settings/romaji/) |
| `selections.tsv` | [何度も選んだ候補](/docs/usage/candidates/#並び方) の記録。Kanaemi が作る |

利用者が打った語を含むファイル（`custom.tsv`・`selections.tsv`）は、Kanaemi が持ち主だけ読み書きできるようにして作ります。

## ファイルを変えたとき

ファイルを書き換えたら、入力欄をクリックし直してください。Kanaemi は、入力欄にフォーカスが入るときに、変わったファイルだけを読み直します。Kanaemi を起動し直す必要はありません。

## ログ

うまく動かないときは、ログを見ると手がかりがあります。ログは設定のフォルダの外にあります。

| OS | 場所 |
| --- | --- |
| macOS | `~/Library/Logs/kanaemi.log` |
| Windows | `%LOCALAPPDATA%\kanaemi\kanaemi.log` |
| Linux | `$XDG_STATE_HOME/kanaemi/kanaemi.log`（なければ `~/.local/state/kanaemi/kanaemi.log`） |

[設定アプリ](/docs/settings/app/) でも、ログの末尾を見られます。
