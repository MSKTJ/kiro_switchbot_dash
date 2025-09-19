# SwitchBot Dashboard

SwitchBot Hub 2を活用したスマートホーム環境の監視・制御ダッシュボードアプリケーション

## 機能

- 🌡️ リアルタイム環境データ表示（温度・湿度・照度）
- 📊 環境データの履歴グラフ表示
- 🚨 環境アラート機能
- 💡 照明デバイス制御
- ❄️ エアコン制御
- 📱 レスポンシブデザイン（PC・タブレット・スマートフォン対応）

## 技術スタック

### フロントエンド
- React 18 + TypeScript
- Tailwind CSS（ダークモード）
- Chart.js（グラフ表示）
- Socket.io-client（リアルタイム通信）
- Vite（ビルドツール）

### バックエンド
- Node.js + Express + TypeScript
- Socket.io（WebSocket通信）
- SwitchBot API V1.1統合

## セットアップ

### 1. 依存関係のインストール

```bash
# ルート、バックエンド、フロントエンドの依存関係を一括インストール
npm run install:all
```

### 2. 環境変数の設定

```bash
# バックエンドの環境変数ファイルをコピー
cp backend/.env.example backend/.env
```

`backend/.env`ファイルを編集してSwitchBot APIの認証情報を設定：

```env
SWITCHBOT_TOKEN=your_switchbot_token_here
SWITCHBOT_SECRET=your_switchbot_secret_here
```

### 3. 開発サーバーの起動

```bash
# フロントエンドとバックエンドを同時に起動
npm run dev
```

- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:3001

## SwitchBot API設定

1. SwitchBotアプリでAPIトークンを取得
2. 開発者向けドキュメント: https://github.com/OpenWonderLabs/SwitchBotAPI
3. 取得したトークンとシークレットを`.env`ファイルに設定

## プロジェクト構造

```
switchbot-dashboard/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/         # 設定管理
│   │   ├── utils/          # ユーティリティ関数
│   │   └── index.ts        # メインサーバーファイル
│   └── package.json
├── frontend/               # React + TypeScript UI
│   ├── src/
│   │   ├── components/     # Reactコンポーネント
│   │   ├── types/          # TypeScript型定義
│   │   └── main.tsx        # メインエントリーポイント
│   └── package.json
└── package.json           # ルートパッケージ設定
```

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# テスト実行
cd backend && npm test
cd frontend && npm test
```

## ライセンス

MIT License