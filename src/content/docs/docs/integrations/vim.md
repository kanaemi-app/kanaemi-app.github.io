---
title: Vim・Neovim
description: kanaemi-mode で、Vim や Neovim から Kanaemi のモードを読み、変える。
---

[kanaemi-mode](https://github.com/kanaemi-app/kanaemi-mode) は、Vim や Neovim から Kanaemi のモードを読んだり、変えたり、変わったときに知らせを受け取ったりするプラグインです。中では [外からの操作](/docs/integrations/control/) を使っています。

Vim（`+channel` と `+timers`）と Neovim で動きます。

## 設定

Kanaemi の [設定ファイル](/docs/settings/config/) に、待つポートを書きます。

```toml
[control]
port = 50123
```

同じポートをプラグインに教えます。

```vim
let g:kanaemi_mode_port = 50123
```

## 挿入モードを抜けたら ABC にする

ノーマルモードに戻ったとき、かなモードのままでコマンドが打てなくなるのを防ぎます。

```vim
autocmd InsertLeave * silent! call kanaemi_mode#set_mode('abc')
```

## ステータスラインにモードを出す

```vim
function! s:on_mode(mode) abort
  let g:ime_mode = a:mode
  redrawstatus
endfunction
let g:ime_mode = v:null
silent! let g:ime_mode = kanaemi_mode#get_mode()
call kanaemi_mode#watch_mode(function('s:on_mode'))
set statusline+=%{g:ime_mode\ is#\ 'kana'\ ?\ '[あ]'\ :\ ''}
```

## 関数

| 関数 | すること |
| --- | --- |
| `kanaemi_mode#get_mode()` | フォーカスのある入力欄のモードを返す |
| `kanaemi_mode#set_mode(mode)` | モードを `mode` にし、変えたあとのモードを返す |
| `kanaemi_mode#watch_mode({ mode -> ... })` | モードが変わるたびに呼ぶ。呼ぶとやめる関数を返す |

うまくいかないときは `kanaemi_mode: ` で始まる例外を投げます。詳しくは `:help kanaemi-mode` を見てください。

## 変数

| 変数 | 既定値 | 内容 |
| --- | --- | --- |
| `g:kanaemi_mode_port` | なし | Kanaemi が待つポート |
| `g:kanaemi_mode_timeout` | `1000` | つなぐとき、答えを待つときに待つ長さ（ミリ秒） |
| `g:kanaemi_mode_reconnect_interval` | `5000` | 知らせを待っているあいだに接続が切れたとき、つなぎ直す間隔（ミリ秒） |
