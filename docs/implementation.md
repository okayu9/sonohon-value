# 実装詳細ドキュメント

## プロジェクト構成
- `src/`
  - `background.ts`: メッセージ受信とバリューブックス検索を担当するバックグラウンドロジック。
  - `browserApi.ts`: `chrome`/`browser`名前空間を透過的に扱う互換レイヤ。
  - `content.ts`: メイン処理の統括（ISBN取得→検索→表示のオーケストレーション）。
  - `isbn.ts`: AmazonページのDOMからISBN情報を抽出するロジック。
  - `parser.ts`: バリューブックスのHTMLレスポンスから書籍情報を抽出するパーサー。
  - `bookLogic.ts`: 書籍選択ロジック（純粋関数、状態名変換・最適書籍選択）。
  - `ui.ts`: Amazonページに挿入するHTML要素の生成とDOM操作。
  - `options.ts` / `options.html` / `options.css`: 拡張機能オプション画面。
  - `manifest.json`: Chromium系ブラウザ（Chrome/Edge）向けManifest V3定義。
  - `manifest.firefox.template.json`: Firefox向けManifest V3テンプレート（ビルド時にGecko IDを埋め込み）。
  - `types.ts`: 共有型定義。
  - `__tests__/`: テストファイル。
- `scripts/build.ts`: ビルド・アセットコピー・Firefoxマニフェスト生成を統合したビルドスクリプト。
- `scripts/package-chrome.ts`: Chromium向けzip出力スクリプト。
- `scripts/package-firefox.ts`: Firefox向けzip出力スクリプト。
- `scripts/sign-firefox.ts`: Firefox署名スクリプト。
- `dist/chrome/`: Chromium向けビルド成果物配置先。
- `dist/firefox/`: Firefox向けビルド成果物配置先。
- `releases/`: `package`コマンド実行時に生成される配布用zipの保存先。

## 実行時フロー概要
1. 対象URLで`content.js`が注入され、`main()`が起動。
2. `isbn.ts`の`isKindlePage`でKindle版かどうかを判定しつつISBN候補を収集。
3. `searchUsedBooks`メッセージをバックグラウンドへ送信。Kindleページの場合は複数のISBNそれぞれについて送信。
4. バックグラウンドが`parser.ts`の`extractBookInfo`を使いバリューブックス検索ページを`fetch`→HTMLから在庫JSONを抽出→`BookInfo`オブジェクトとして返却。
5. Kindleページの場合は`bookLogic.ts`の`selectBestBookInfo`で新品在庫→最安値→在庫状態数の優先度で最適な書籍データを選択。
6. `ui.ts`の`displayVBAPriceInfo`がUIを生成し、ユーザー設定に基づく位置へ挿入。
7. UI内の「オプション」リンクからオプションページを開き、設定を更新すると`storage.sync`に保存される。

## ブラウザ互換レイヤ（`src/browserApi.ts`）
- `browser`名前空間（Firefox）と`chrome`名前空間（Chromium系）を検出して単一の`browserApi`としてエクスポート。
- 互換レイヤを通じて`runtime`/`storage`APIへアクセスすることでソース内のブラウザ分岐を最小化。
- APIが存在しない場合は即座に例外を投げ、ビルド時に検知しやすくしている。

## ISBN抽出（`src/isbn.ts`）
- `getISBN(doc)`はCSS疑似クラスに依存せず、候補要素のテキストを走査してISBN-13を抽出。
  - 商品詳細セクション（`#rpi-attribute-book_details-isbn13`）を最優先。
  - 詳細箇条書き（`#detailBullets_feature_div .a-list-item`）や旧レイアウト（`#productDetailsTable .content li`）もテキストマッチで対応。
- Kindleページは`tmmSwatchesList`以下の紙書籍リンクからISBN-10を抽出（`getKindlePageISBNs`）。
- `isKindlePage(doc)`はフォーマット選択、タイトル文言、購入ボックス有無など複数条件を評価。

## HTMLパーサー（`src/parser.ts`）
- `extractBookInfo`が`<router-view :item-info="…">`属性または`window.__NUXT__`初期データから在庫JSONを抽出。
- `decodeAndParse`でHTML実体参照をデコードし、`isBookInfo`バリデーションを通してから`BookInfo`として返却。
- `extractFromNuxtData`はNUXTデータの前処理（`undefined`→`null`置換）と構造検証を行うフォールバック。

## 書籍選択ロジック（`src/bookLogic.ts`）
- `selectBestBookInfo`が複数の`BookInfo`から最適なものを選択（新品優先→最安値→在庫状態数）。
- `convertConditionName`が英語の商品状態名を日本語に変換。
- すべて純粋関数で副作用なし。

## コンテンツスクリプト（`src/content.ts`）
- 各モジュールを統括するオーケストレーター。
- `sendMessage`経由で`browserApi.runtime.sendMessage`を呼び出し、`searchUsedBooks`アクションのレスポンスをPromiseでラップ。
- エラー時は`ui.ts`の`displayError`でユーザーにインライン通知を表示。

## UI描画と挿入（`src/ui.ts`）
- `createPriceInfoHTML`が在庫テーブルのHTMLを生成し、挿入場所に応じて区切り線を制御。
- `findInsertionPoint`が挿入候補ID群（`tellAmazon_feature_div`など）を探索し、`insertElement`でDOMへ差し込む。
- 表示済みUIが存在する場合は再描画前に削除。オプションリンクは`openOptionsPage`メッセージを発火。
- `displayError`がエラー時にインライン警告を表示。

## バックグラウンドスクリプト（`src/background.ts`）
- `browserApi.runtime.onMessage`で`searchUsedBooks`と`openOptionsPage`を受け取り、前者は非同期レスポンスのため`true`を返却。
- `searchUsedBooks`がバリューブックスの検索結果HTMLを取得し、`parser.ts`の`extractBookInfo`で書籍情報を抽出して`BookInfo`オブジェクトとして返却。
- 解析できない場合は例外として伝播し、呼び出し元にはエラーメッセージを返す。

## 型定義（`src/types.ts`）
- `BookInfo`: `vs_catalog_id`と各状態 (`conditionName` / `price` / `stock`) を保持。
- `InsertionLocation`: UI挿入位置オプション（`default` / `between_reviews_description` / `below_details`）。
- `MessageResponse`: `BookInfo`オブジェクトまたはエラー文字列。
- `InsertionPoint`: 挿入対象親要素と参照ノード。

## オプションページ実装
- `restoreOptions`が`browserApi.storage.sync`から設定を読み、UIに反映。
- `saveOptions`は変更時に設定を保存し、結果をステータスメッセージ(`#status-message`)でフィードバック。
- `displayVersionInfo`が`browserApi.runtime.getManifest()`からバージョンを取得してフッターへ表示。
- UIはライトテーマ想定のカードレイアウトで、レスポンシブ対応（600px以下で余白・フォントを縮小）。

## ビルドと配布
### Chromium系（Chrome/Edgeなど）
- `npm run build:chrome` / `npm run build:chrome:prod`: `dist/chrome/`へバンドル（`target=es2020`）。
- `npm run build:chrome:all` / `npm run build:chrome:prod:all`: クリーン→ビルド→資産コピーを一括実行。
- `npm run package:chrome`: `dist/chrome/manifest.json`のバージョンを読み、`releases/value-search-v{version}.zip`を生成。

### Firefox
- `npm run build:firefox` / `npm run build:firefox:prod`: `dist/firefox/`へバンドル（`target=firefox115`）。
- `npm run build:firefox:all` / `npm run build:firefox:prod:all`: クリーン→ビルド→資産コピーを一括実行。
- `npm run package:firefox`: Firefox向け成果物を`releases/firefox/value-search-firefox-v{version}.zip`に出力。

## マニフェスト構成
- Chromium版: `manifest.json`
  - `background.service_worker`で`background.js`を登録。
  - `options_page`に`options.html`を指定。
- Firefox版: `manifest.firefox.template.json`（ビルド時に`build.ts`でGecko IDを埋め込み）
  - `background.scripts` + `type: "module"`でイベントページとして動作。
  - `options_ui.page`に`options.html`を指定。
  - `browser_specific_settings.gecko`で拡張IDと`strict_min_version`（115.0）を宣言。

## 検証フロー
1. **Chromium**
   - `npm run build:chrome:all` → Chrome/Edgeの`chrome://extensions`から`dist/chrome/`を読み込んで動作確認。
2. **Firefox**
   - `npm run build:firefox:all` → Firefoxの`about:debugging#/runtime/this-firefox`で`dist/firefox/`を読み込む。
   - または`npm run package:firefox`で生成したzipを`web-ext sign`やAMOのアップロードに使用。
3. **共通テスト観点**
   - Kindleページと通常書籍ページで在庫表示・オプション反映を確認。
   - 在庫無しケースでUIが非表示/文言表示になるかチェック。
   - オプション更新後のリロードで設定値が維持されるか検証。

## テスト
- [Vitest](https://vitest.dev/) を使用。`npm test` で実行。
- `src/__tests__/parser.test.ts`: HTMLパース、entityデコード、NUXTデータ抽出、BookInfoバリデーション。
- `src/__tests__/bookLogic.test.ts`: 状態名変換、最適書籍選択（新品優先、最安値、出品数等）。
- `src/__tests__/isbn.test.ts`: `sanitizeISBN`のバリデーション。
- `src/__tests__/isbn.dom.test.ts`: jsdom環境でのISBN抽出、Kindle判定、紙書籍版ISBN取得。

## 改善のヒント
- バリューブックスサイトのDOM変更に備え、`parser.ts`の`extractBookInfo`やNUXTデータ解析ロジックは定期的に確認する。
- Amazon側DOM変更時は`isbn.ts`の`getISBN`や`ui.ts`の`findInsertionPoint`の条件を再調整する。
- Firefoxでは`browser_specific_settings.gecko.id`が必須なため、固有IDに置き換えて署名フローを整備する。
- `browserApi`経由でAPIを利用しているため、新しい機能を追加する際は`chrome`専用APIかどうかを確認してから呼び出す。
