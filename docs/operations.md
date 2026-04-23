# 運用ガイド

## 環境前提
- Node.js 24 (LTS) 以上。
- npm: プロジェクト直下で `npm install` 済みであること。
- `.env` に以下の値を設定（`WEB_EXT_API_*` はFirefox署名時のみ必須）。
  - `WEB_EXT_API_KEY`
  - `WEB_EXT_API_SECRET`
  - `WEB_EXT_GECKO_ID`
- Chrome/Edge向けは追加の環境変数不要。

## ビルド
### Chromium系（Chrome / Edge）
- 開発ビルド: `npm run build:chrome`（バンドル+ソースマップ）。
- 本番ビルド: `npm run build:chrome:prod`（バンドル+minify）。
- 全処理（クリーン→ビルド→静的ファイルコピー）: `npm run build:chrome:all` / `npm run build:chrome:prod:all`。
- 出力先: `dist/chrome/`。

### Firefox
- 全処理（クリーン→ビルド→マニフェスト生成→静的ファイルコピー）: `npm run build:firefox:all` / `npm run build:firefox:prod:all`。
- `.env` に `WEB_EXT_GECKO_ID` を設定するか、`WEB_EXT_GECKO_ID=example@id npm run build:firefox:all` のように環境変数を指定。
- 出力先: `dist/firefox/`。

## パッケージ生成
- Chromium向けZip: `npm run package:chrome` → `releases/value-search-v<version>.zip`。
- Firefox向けZip: `npm run package:firefox` → `releases/firefox/value-search-firefox-v<version>.zip`。

## 署名（Firefox）
- 事前条件: `.env` に以下を設定し、最新ビルドを作成済み。
  - `WEB_EXT_API_KEY`, `WEB_EXT_API_SECRET`: AMO の JWT キー。
  - `WEB_EXT_GECKO_ID`: 拡張機能ID。
  - `WEB_EXT_CHANNEL`: `listed`（AMO公開）または `unlisted`（署名のみ、既定値）。
  - `WEB_EXT_AMO_LICENSE`: 提出するライセンス識別子（例: `Apache-2.0`）。未設定時は `all-rights-reserved` を自動適用。
  - `WEB_EXT_AMO_SUMMARY`: AMOに表示される概要文（未設定時は英語のデフォルトテキスト）。
  - `WEB_EXT_AMO_CATEGORIES`: AMOカテゴリ（カンマ区切り、未設定時は `other`）。
- 署名実行: `npm run sign:firefox`
  - 内部で `scripts/sign-firefox.ts` が `.env` を読み込み、必要に応じてライセンス情報を含むメタデータファイルを生成した上で `npx web-ext sign` を実行。
  - 成功すると `releases/firefox/` に署名済み `.xpi` が生成され、AMOダッシュボードにも記録される。

## 動作確認フロー
1. **Chromium系**: `npm run build:chrome:all` → `chrome://extensions` で「パッケージ化されていない拡張機能を読み込む」→ `dist/chrome/` を指定。
2. **Firefox**: `npm run build:firefox:all` → `about:debugging#/runtime/this-firefox` → 「一時的なアドオンを読み込む」→ `dist/firefox/manifest.json` を指定（拡張子フィルターを「すべてのファイル」に変更）。
3. Kindle / 通常書籍ページでISBN検出・在庫表示・オプション反映を確認。

## よくあるトラブルと対処
- **manifest.jsonが選択できない**: ファイルダイアログのフィルターを「すべてのファイル」に変更するか同フォルダ内の任意ファイルを選択。
- **Firefoxで「壊れている」と表示される**: 署名されていない `.xpi` を常設しようとすると出る。`about:debugging` の一時読み込みか、`npm run sign:firefox` で署名済みパッケージを利用。
- **環境変数が読み込まれない**: `.env` が未作成または `npm run sign:firefox` / `build:firefox:*` 実行時に `WEB_EXT_GECKO_ID` 等が未設定。`.env.example` を参照し `.env` を作成。

## リリース手順の例
1. `npm run package:chrome` で Chromium 向けZipを生成。
2. `npm run package:firefox` でFirefox向けZipを生成。
3. Firefox向けが公開用の場合は `npm run sign:firefox` で署名 `.xpi` を取得。
4. Chrome Web Store / Edge Add-ons / AMO それぞれのダッシュボードからアップロード。
5. 各ブラウザで最終動作確認後、README やリリースノートを更新。
