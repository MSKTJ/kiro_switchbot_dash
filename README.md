# SwitchBot Dashboard

SwitchBot Hub 2を活用したスマートホーム環境の監視・制御ダッシュボードアプリケーション

## 機能

- 🌡️ リアルタイム環境データ表示（温度・湿度・照度）
- 📊 環境データの履歴グラフ表示
- 🚨 環境アラート機能
- 💡 **照明制御機能**
  - ON/OFFトグルスイッチ
  - 明るさ調整スライダー（0-100%）
  - 明るさプリセットボタン（25%, 50%, 75%, 100%）
  - リアルタイム制御フィードバック
  - 複数照明デバイスの一括管理
- ❄️ エアコン制御
- 🎛️ デバイス管理
  - デバイス状態監視
  - 接続テスト機能
  - デバイス統計情報
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

### 4. 照明制御機能の使用方法

1. ダッシュボードの「照明制御」タブをクリック
2. 制御したい照明デバイスを選択
3. 以下の操作が可能：
   - **電源制御**: ON/OFFボタンまたはトグルスイッチ
   - **明るさ調整**: スライダーまたはプリセットボタン
   - **一括制御**: 複数デバイスの同時管理

#### 照明制御API エンドポイント

- `POST /api/devices/:deviceId/light/toggle` - 電源トグル
- `POST /api/devices/:deviceId/light/power` - 電源設定（on/off）
- `POST /api/devices/:deviceId/light/brightness` - 明るさ設定（0-100）

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
│   │   ├── models/         # データモデル
│   │   ├── routes/         # APIルート
│   │   ├── services/       # ビジネスロジック
│   │   ├── utils/          # ユーティリティ関数
│   │   └── index.ts        # メインサーバーファイル
│   └── package.json
├── frontend/               # React + TypeScript UI
│   ├── src/
│   │   ├── components/     # Reactコンポーネント
│   │   │   ├── LightControl.tsx        # 照明制御コンポーネント
│   │   │   ├── LightControlPanel.tsx   # 照明制御パネル
│   │   │   └── Dashboard.tsx           # メインダッシュボード
│   │   ├── hooks/          # カスタムフック
│   │   │   └── useLightControl.ts      # 照明制御フック
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