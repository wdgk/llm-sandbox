# ローカルLLM チャットボット

ローカルで動作するOllama + mistralを使用したチャットボットアプリケーション。コマンドライン版とWeb版の両方のインターフェースを提供します。

## 🌟 特徴

- **ローカル実行**: インターネット接続不要でプライベートな環境で動作
- **複数インターフェース**: CLI とWebブラウザの両方で利用可能
- **高品質**: TypeScript + TDD（t-wada式）による堅牢な実装
- **包括的ログ**: 詳細なログ機能とエラーハンドリング
- **テスト完備**: 33のテストによる品質保証

## 📋 必要条件

- **Node.js**: v18.20.8以上（推奨: v20以上）
- **npm**: v10以上
- **Ollama**: ローカルLLMランタイム

## 🚀 クイックスタート

### 1. Ollamaのインストール

```bash
# macOS (Homebrew)
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windowsの場合は公式サイトからダウンロード
# https://ollama.ai/download
```

### 2. Ollamaサーバーの起動

```bash
# Ollamaサーバーを起動
ollama serve

# 別ターミナルでmistralモデルをダウンロード
ollama pull mistral
```

### 3. プロジェクトのセットアップ

```bash
# リポジトリをクローン
git clone <repository-url>
cd local-chatbot

# 依存関係をインストール
npm install

# 環境変数ファイルをコピー（必要に応じて編集）
cp .env.example .env
```

### 4. アプリケーションの実行

#### CLIインターフェース
```bash
npm run chat
```

#### Webプレイグラウンド
```bash
npm run playground
# ブラウザで http://localhost:3000 を開く
```

## 📁 プロジェクト構成

```
local-chatbot/
├── src/
│   ├── cli.ts              # CLIインターフェース
│   ├── playground.ts       # Webプレイグラウンド
│   ├── chat.ts            # 基本チャット機能
│   ├── logger.ts          # ログ機能
│   ├── index.ts           # メインエントリーポイント
│   ├── mastra/            # Mastra設定
│   └── *.test.ts          # テストファイル
├── agents/
│   └── default.ts         # デフォルトチャットエージェント
├── mastra.config.ts       # Mastra設定ファイル
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── .env                   # 環境変数
```

## 🛠️ 使用方法

### CLIインターフェース

```bash
npm run chat
```

**利用可能なコマンド:**
- `help`, `ヘルプ`, `?` - ヘルプを表示
- `exit`, `quit`, `bye`, `終了`, `さようなら` - チャット終了

### Webプレイグラウンド

```bash
npm run playground
```

ブラウザで `http://localhost:3000` にアクセスしてWebUIを使用できます。

### 開発者向けコマンド

```bash
# 開発モード（ファイル監視）
npm run dev

# テスト実行
npm test
npm run test:ui      # UIモードでテスト実行
npm run test:run     # CI用の一回実行

# ビルド
npm run build

# TypeScript型チェック
npm run typecheck

# 本番ビルド実行
npm run start                # メインアプリケーション
npm run chat:build          # CLIの本番ビルド
npm run playground:build    # プレイグラウンドの本番ビルド
```

## ⚙️ 設定

### 環境変数

`.env` ファイルで以下の設定が可能です：

```env
# Ollama設定
OLLAMA_BASE_URL=http://127.0.0.1:11434/v1
OLLAMA_MODEL=mistral

# プレイグラウンド設定
PLAYGROUND_PORT=3000

# ログ設定
NODE_ENV=development  # development | production
```

### Ollama設定

デフォルトでは `mistral` モデルを使用しますが、他のモデルも利用可能です：

```bash
# 他のモデルをダウンロード
ollama pull llama2
ollama pull codellama

# 環境変数でモデルを変更
OLLAMA_MODEL=llama2
```

## 🧪 テスト

### テスト実行

```bash
# 全テスト実行
npm test

# 特定のテストファイル実行
npm test src/chat.test.ts

# テストカバレッジ表示
npm test -- --coverage

# UI モードでテスト実行
npm run test:ui
```

### テスト構成

- **ユニットテスト**: 各機能の単体テスト
- **統合テスト**: Ollama APIとの統合テスト
- **パフォーマンステスト**: レスポンス時間の測定
- **エラーハンドリングテスト**: 異常系のテスト

合計 **33テスト** で品質を保証しています。

## 📊 ログ機能

### ログレベル

- **DEBUG**: 詳細なデバッグ情報
- **INFO**: 一般的な情報
- **WARN**: 警告
- **ERROR**: エラー

### ログ出力例

```bash
[2025-07-27 14:40:52.420] INFO: チャット実行完了 | Context: {"duration":"0ms","responseLength":8,"model":"mistral"}
[2025-07-27 14:40:52.436] DEBUG: HTTPリクエスト受信 | Context: {"method":"GET","url":"/","clientIP":"127.0.0.1"}
```

### ログ設定

環境変数 `NODE_ENV` でログレベルが自動調整されます：

- `development`: DEBUG レベル
- `production`: INFO レベル

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. Ollama接続エラー

```bash
❌ Ollama接続失敗
```

**解決方法:**
```bash
# Ollamaサーバーが起動しているか確認
ollama list

# サーバーを起動
ollama serve

# mistralモデルがダウンロード済みか確認
ollama pull mistral
```

#### 2. ポート競合エラー

```bash
Error: listen EADDRINUSE :::3000
```

**解決方法:**
```bash
# 環境変数でポートを変更
PLAYGROUND_PORT=3001 npm run playground
```

#### 3. TypeScriptエラー

```bash
# 型チェック実行
npm run typecheck

# node_modulesを再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 4. テスト失敗

```bash
# テスト環境のクリア
npm test -- --clearCache

# 特定のテストのみ実行
npm test -- --run src/specific.test.ts
```

## 🏗️ 技術スタック

### フロントエンド
- **TypeScript**: 型安全な開発
- **Vite**: 高速ビルドツール
- **vanilla JavaScript**: プレイグラウンドUI

### バックエンド
- **Node.js**: ランタイム環境
- **Ollama**: ローカルLLMランタイム
- **OpenAI SDK**: Ollama互換API
- **Mastra**: LLMアプリケーションフレームワーク

### 開発ツール
- **Vitest**: テストフレームワーク
- **TDD**: t-wada式テスト駆動開発
- **tsx**: TypeScript実行環境
- **readline-sync**: CLI入力処理
- **chalk**: カラー出力

### UI/UX
- **CLI**: `readline-sync` + `chalk`
- **Web**: レスポンシブHTMLインターフェース
- **ログ**: カラー付きコンソール出力

## 📈 パフォーマンス

### ベンチマーク

- **平均レスポンス時間**: 2-5秒（モデルサイズに依存）
- **メモリ使用量**: 50-100MB（Node.js）
- **同時接続**: Webプレイグラウンドは単一接続を想定

### 最適化

- **ログバッファ**: メモリ使用量制限（最大1000エントリ）
- **エラーハンドリング**: 適切なリソースクリーンアップ
- **型チェック**: ビルド時の最適化

## 🤝 貢献

1. フォークしてください
2. フィーチャーブランチを作成: `git checkout -b feature/amazing-feature`
3. テストを書いて実行: `npm test`
4. コミット: `git commit -m 'Add amazing feature'`
5. プッシュ: `git push origin feature/amazing-feature`
6. プルリクエストを作成

### 開発ガイドライン

- **TDD**: テストファースト開発
- **TypeScript**: 型安全性の維持
- **CLAUDE.md**: プロジェクト固有のガイドラインに従う
- **意味のある命名**: `common`, `util` などの汎用語を避ける

## 📄 ライセンス

ISC License

## 🙋‍♂️ サポート

問題やバグを発見した場合は、[GitHub Issues](../../issues) に報告してください。

## 🚗 ロードマップ

- [x] 基本的なチャット機能
- [x] CLIインターフェース
- [x] Webプレイグラウンド
- [x] 包括的なログ機能
- [x] エラーハンドリング
- [ ] チャット履歴の保存
- [ ] マルチモデル対応
- [ ] プラグインシステム
- [ ] Docker対応
- [ ] ストリーミングレスポンス

---

**🤖 Generated with [Claude Code](https://claude.ai/code)**