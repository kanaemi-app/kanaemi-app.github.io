---
title: 関数を足す
description: 表記の置き場所を埋める関数を、Luau で書いて足す。
---

[表記の置き場所](/docs/reference/placeholders/) を埋める関数は、自分で書いて足せます。関数は [Luau](https://luau.org/) で書き、[設定のフォルダ](/docs/settings/folder/) の `functions` フォルダに置きます。

```luau
-- functions/dai.luau：数を位取りした漢数字にし、「第」を付ける（12 → 第十二）
return function(source, arg)
  local digits = kanaemi.number.digits(source)
  local kanji = digits and kanaemi.number.counted(digits, false)
  return kanji and ("第" .. kanji)
end
```

このファイルを置けば、辞書に `{}わ	{dai}話` と書いて、`;12wa` から「第十二話」が出ます。

## 関数のファイル

- `functions` フォルダの直下にある `.luau` のファイルのうち、関数を返すもの 1 つが関数 1 つです。拡張子を除いたファイル名が、関数の名前になります。
- 関数は、変換元（文字列）と引数（文字列か `nil`）を受け取り、置き場所を埋める文字列を返します。`nil` を返すと、その項目から候補を作りません。
- [組み込みの関数](/docs/reference/placeholders/#組み込みの関数) と同じ名前のファイルを置くと、そのファイルの関数を使います。
- 関数を返さないファイルと、`functions` の中のフォルダにあるファイルは、ほかのファイルから読むモジュールです。
- ファイルを足したり書き換えたりしたら、入力欄をクリックし直すと読み直します。

```luau
-- functions/date.luau：今日の日付を、引数の書式で書く
return function(source, arg)
  return os.date(arg or "%Y-%m-%d")
end
```

## 使えるもの

- Luau の標準ライブラリ。Luau には、ファイル・環境変数・ほかのプログラムに触れる関数はありません。
- `require` で、`functions` の中のモジュールを、読むファイルからの相対パスで読めます（`require("./lib/util")`）。`functions` の外は読めません。
- 関数どうしで値をやりとりするときは、同じモジュールを `require` して、そのテーブルを使います。グローバル変数に書いた値は、ほかの関数から見えるとは限りません。

```luau
-- functions/lib/counter.luau：関数が共有するモジュール
return { count = 0 }
```

```luau
-- functions/count.luau：呼ぶたびに 1 つ大きい数を書く
local counter = require("./lib/counter")
return function(source, arg)
  counter.count += 1
  return tostring(counter.count)
end
```

### kanaemi

関数を書くのに使える、Kanaemi が用意する関数です。数は、数字の値（0〜9）を前から並べたリスト（`{ 2, 0, 2, 6 }`）で扱います。Luau の数に収まらない大きな数も、そのまま扱えます。

| 関数 | 返す値 |
| --- | --- |
| `kanaemi.number.digits(source)` | `source` の数字（半角と全角。混ざっていてもよい）の値のリスト。数字のほかの文字があるとき、空のときは `nil` |
| `kanaemi.number.counted(digits, daiji)` | 先頭の 0 を落とし、位取りした漢数字。`daiji` が真なら大字。京の 1 万倍以上なら `nil` |
| `kanaemi.time.milliseconds()` | いまの、1970-01-01（UTC）からのミリ秒。Luau の `os.time` は秒までしか分からない |
| `kanaemi.random.bytes(count)` | OS が用意する、暗号に使える乱数の `count` バイト（0〜1024）の文字列。重なってはいけない値や、推測されてはいけない値に使う。`math.random` はそれに使えない |

## うまく動かないとき

- Luau として読めないファイル、読むとエラーになるファイル、名前に使えない文字を含む名前のファイルは使わず、[ログ](/docs/settings/folder/#ログ) に残します。[設定アプリ](/docs/settings/app/#関数) でも、使えない関数とそのわけを見られます。
- エラーになった関数、長く動き続けた関数、メモリを使いすぎた関数は、失敗として扱い、候補を作りません。関数ごとに、最初の失敗をログに残します。長く動き続けた関数は、読み直すまで呼びません。
- `print` で出した文字は、関数の名前を添えてログに書きます。

## 使わないようにする

[設定ファイル](/docs/settings/config/) の `[functions] disabled` に、使わない関数を書きます。`functions` フォルダの関数はファイル名（拡張子を除く）で、組み込みの関数は `"builtin:名前"` で書きます。

```toml
[functions]
disabled = ["count", "builtin:uuid"]
```

- `functions` フォルダの関数を外すと、同じ名前の組み込みの関数があれば、それを使います。
- 外したファイルも、ほかの関数が `require` するモジュールとしては読めます。
- [設定アプリ](/docs/settings/app/#関数) でも選べます。
