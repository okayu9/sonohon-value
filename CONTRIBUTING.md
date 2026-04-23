# Contributing

## 開発環境のセットアップ

- Node.js 24 (LTS) 以上

```bash
git clone https://github.com/okayu9/value-search.git
cd value-search
npm install
```

## 開発ワークフロー

```bash
npm run build:chrome:all    # Chrome 用ビルド
npm run build:firefox:all   # Firefox 用ビルド
npm run watch:chrome        # Chrome 用ファイル監視ビルド
npm run watch:firefox       # Firefox 用ファイル監視ビルド
npm test                    # テスト実行
npm run typecheck           # 型チェック
npm run lint                # Biome による lint
npm run lint:fix            # lint の自動修正
```

> **注意**: Firefox 用ビルドには `WEB_EXT_GECKO_ID` 環境変数が必要です。`.env.example` を `.env` にコピーして設定してください。

## コードスタイル

[Biome](https://biomejs.dev/) でフォーマットと lint を管理しています。コミット前に `npm run lint` が通ることを確認してください。

- インデント: スペース 4 つ
- クォート: シングルクォート
- セミコロン: あり

## テスト

[Vitest](https://vitest.dev/) を使用しています。新しいロジックを追加する場合はテストも追加してください。

```bash
npm test            # 全テスト実行
npm run test:watch  # ウォッチモード
```

## Pull Request

1. `main` ブランチから新しいブランチを作成
2. 変更を加え、テストと lint が通ることを確認
3. PR を作成し、変更内容を説明

## プロジェクト構成

```
src/
├── background.ts    # Service Worker（バリューブックス API との通信）
├── content.ts       # コンテンツスクリプト（メイン処理の統括）
├── isbn.ts          # Amazon ページからの ISBN 抽出
├── parser.ts        # バリューブックス HTML のパース
├── bookLogic.ts     # 書籍選択ロジック（純粋関数）
├── ui.ts            # DOM への UI 挿入
├── browserApi.ts    # Chrome/Firefox 互換レイヤー
├── types.ts         # 型定義
├── options.ts       # オプションページ
└── __tests__/       # テストファイル
```
