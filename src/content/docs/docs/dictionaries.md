---
title: 辞書を入れる
description: 変換に使う辞書を、設定のフォルダの dictionaries フォルダに置く。
---

Kanaemi は、[設定のフォルダ](/docs/settings/folder/) の `dictionaries` フォルダに置いた辞書で変換します。置くだけで使われ、設定ファイルに書く必要はありません。

## 公式辞書

Kanaemi のための辞書は、[kanaemi-dict](https://github.com/kanaemi-app/kanaemi-dict) で作っています。

- 基本辞書（`base.tsv`）：ふだんの文章に出てくる語。活用する語と、数を含む語（「3 本」「第 2 回」）も入っています。まずはこれを置いてください。
- 追加辞書：分野ごとの語。基本辞書にない語だけを持つので、基本辞書に足して使います。

| 追加辞書 | ファイル |
| --- | --- |
| 地名 | `place.tsv` |
| 鉄道 | `railway.tsv` |
| 法律 | `law.tsv` |
| 経済 | `economy.tsv` |
| IT | `it.tsv` |
| 科学 | `science.tsv` |
| 医療 | `medical.tsv` |
| 料理 | `cooking.tsv` |
| 音楽 | `music.tsv` |
| スポーツ | `sports.tsv` |
| ゲーム | `games.tsv` |

## 置き方

1. 辞書のファイル（`.tsv`）を取ってくる。
2. [設定のフォルダ](/docs/settings/folder/) の中の `dictionaries` フォルダに置く。フォルダがなければ作る。
3. 入力欄をクリックし直す。Kanaemi は、入力欄にフォーカスが入るときに、変わった辞書を読み直します。

`dictionaries` の中にフォルダを作って分けてもかまいません。

## 使う順番

辞書の一覧を書かなければ、Kanaemi は次の順に辞書を使います。先にある辞書の候補ほど前に出やすくなります。

1. [ユーザーカスタム辞書](/docs/usage/register/)（`custom.tsv`。登録した語が入る）
2. `dictionaries` の中の辞書を、ファイル名の順に

順番を変えたいとき、一部の辞書だけを使いたいときは、[辞書の一覧](/docs/settings/dictionaries/) を書きます。

## 読み込みを速くする

テキストの辞書（`.tsv`）は、[設定アプリ](/docs/settings/app/) でバイナリの辞書（`.kdic`）に変換できます。バイナリの辞書は、中身はテキストの辞書と同じで、読み込みが速く、使うメモリも少なくなります。大きな辞書は変換しておくのがおすすめです。

## SKK の辞書を使う

SKK の辞書（`SKK-JISYO.L` など）は、[設定アプリ](/docs/settings/app/) で取り込めます。設定アプリが Kanaemi の形式に変換し、`dictionaries` に「元の名前.tsv」として置きます。

## 自分で書く

辞書はただのテキストファイルです。1 行に 1 語、読みと表記をタブで区切って書きます。

```tsv
# 自分の辞書
きしゃ	記者
かなえみ	Kanaemi
```

書き方の詳しいことは [テキストの辞書の形式](/docs/reference/text-dictionary/) にあります。
