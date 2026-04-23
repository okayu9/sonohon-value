# その本、バリューにあるよ

Amazon.co.jp の書籍ページに、バリューブックス（中古書店）の在庫状況・価格・コンディションを表示するブラウザ拡張機能です。Chrome と Firefox に対応しています。

## 機能

- Amazon.co.jp の書籍ページから自動的に ISBN を取得
- バリューブックスでの在庫状況を確認
- コンディション別（新品、非常に良い、良い、キズや使用感あり）の価格を表示
- バリューブックスの商品ページへのリンクを提供
- Kindle ページでも紙書籍版の在庫を検索
- オプション設定で表示位置や在庫切れ表示の有無を選択可能

## インストール

### Chrome
[Chrome ウェブストア](https://chromewebstore.google.com/detail/kimpmmanlecdbnjbafcibnicgoflgjje)からインストール。

### Firefox
[AMO（Add-ons for Firefox）](https://addons.mozilla.org/ja/firefox/addon/sonohon-value/)からインストール。

## 使い方

1. Amazon.co.jp の書籍ページにアクセスする
2. ページ内に自動的にバリューブックスの在庫情報が表示される
3. 「バリューブックスに移動する」リンクをクリックすると、該当書籍のバリューブックスページが開く

## オプション設定

拡張機能のオプションページから以下を設定できます：

- **在庫がない場合も表示する**: バリューブックスに在庫がない場合でも情報を表示
- **挿入位置**: 在庫情報の表示位置を選択（デフォルト / 評価と概要文の間 / すべての詳細の下）

オプションページへのアクセス：
- 拡張機能アイコンを右クリック →「オプション」を選択
- または、Amazon 書籍ページに表示される「オプション」リンクをクリック

## 対応ページ

以下の Amazon.co.jp の URL パターンに対応しています：

- `https://www.amazon.co.jp/dp/*`
- `https://www.amazon.co.jp/*/dp/*`
- `https://www.amazon.co.jp/gp/product/*`
- `https://www.amazon.co.jp/exec/obidos/ASIN/*`
- `https://www.amazon.co.jp/o/ASIN/*`

## 注意事項

- Amazon.co.jp の書籍ページでのみ動作します
- ISBN が取得できない書籍では機能しません
- バリューブックスや Amazon のウェブサイト構造が変更された場合、正常に動作しなくなる可能性があります

## 開発

開発に参加する場合は [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

## ライセンス

[Apache License 2.0](LICENSE)
