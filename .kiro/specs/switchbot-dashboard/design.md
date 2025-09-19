# デザイン文書

## 概要

SwitchBot Hub 2を活用したダッシュボードWebアプリケーションのシステム設計です。リアルタイムな環境データ表示、デバイス制御、アラート機能を提供するモダンなWebアプリケーションを構築します。

## アーキテクチャ

### システム構成

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   フロントエンド   │    │   バックエンド    │    │  SwitchBot API  │
│   (React/Vue)    │◄──►│   (Node.js)     │◄──►│    V1.1         │
│                 │    │                 │    │                 │
│ - ダッシュボード  │    │ - API プロキシ   │    │ - デバイス制御   │
│ - リアルタイム表示│    │ - データ集約     │    │ - センサーデータ │
│ - デバイス制御UI │    │ - WebSocket     │    │ - デバイス一覧   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 技術スタック

**フロントエンド:**
- React 18 + TypeScript
- Tailwind CSS (ダークモード対応)
- Chart.js (グラフ表示)
- Socket.io-client (リアルタイム通信)

**バックエンド:**
- Node.js + Express + TypeScript
- Socket.io (WebSocket通信)
- Axios (HTTP クライアント)
- dotenv (環境変数管理)

## コンポーネントとインターフェース

### フロントエンドコンポーネント構成

```
App
├── Header
├── Dashboard
│   ├── EnvironmentCards
│   │   ├── TemperatureCard
│   │   ├── HumidityCard
│   │   └── LightCard
│   ├── EnvironmentChart
│   ├── AlertBanner
│   └── DeviceControls
│       ├── LightControl
│       └── AirConditionerControl
├── SettingsModal
└── Footer
```

### APIインターフェース

#### バックエンドAPI エンドポイント

```typescript
// 環境データ取得
GET /api/environment
Response: {
  temperature: number;
  humidity: number;
  light: number;
  timestamp: string;
}

// デバイス一覧取得
GET /api/devices
Response: {
  devices: Array<{
    deviceId: string;
    deviceName: string;
    deviceType: 'Light' | 'Air Conditioner';
    status: 'on' | 'off';
    properties?: any;
  }>;
}

// デバイス制御
POST /api/devices/:deviceId/control
Body: {
  command: string;
  parameter?: any;
}

// 設定取得・更新
GET /api/settings
POST /api/settings
Body: {
  updateInterval: number;
  temperatureThreshold: { min: number; max: number };
  humidityThreshold: { min: number; max: number };
}
```

#### WebSocket イベント

```typescript
// サーバー → クライアント
'environmentUpdate': EnvironmentData
'deviceStatusUpdate': DeviceStatus
'alertTriggered': AlertData

// クライアント → サーバー
'subscribeEnvironment': void
'unsubscribeEnvironment': void
```

### SwitchBot API 統合

#### 使用するSwitchBot API エンドポイント

```typescript
// デバイス一覧取得
GET https://api.switch-bot.com/v1.1/devices
Headers: {
  Authorization: `${token}`,
  sign: `${sign}`,
  t: `${timestamp}`,
  nonce: `${nonce}`
}

// デバイス状態取得
GET https://api.switch-bot.com/v1.1/devices/{deviceId}/status

// デバイス制御
POST https://api.switch-bot.com/v1.1/devices/{deviceId}/commands
Body: {
  command: string;
  parameter?: string;
}
```

## データモデル

### 環境データモデル

```typescript
interface EnvironmentData {
  temperature: number;    // 摂氏温度
  humidity: number;       // 湿度パーセンテージ
  light: number;         // 照度 (lux)
  timestamp: Date;       // データ取得時刻
}

interface EnvironmentHistory {
  data: EnvironmentData[];
  maxSize: number;       // メモリ上の最大保存件数
}
```

### デバイスモデル

```typescript
interface Device {
  deviceId: string;
  deviceName: string;
  deviceType: 'Light' | 'Air Conditioner' | 'Hub';
  status: 'online' | 'offline';
  properties: DeviceProperties;
}

interface LightProperties {
  power: 'on' | 'off';
  brightness?: number;   // 0-100
}

interface AirConditionerProperties {
  power: 'on' | 'off';
  mode: 'cool' | 'heat' | 'dry' | 'auto';
  temperature: number;   // 設定温度
}
```

### 設定モデル

```typescript
interface AppSettings {
  updateInterval: number;  // データ更新間隔（秒）
  temperatureThreshold: {
    min: number;
    max: number;
  };
  humidityThreshold: {
    min: number;
    max: number;
  };
  theme: 'dark' | 'light';
}
```

### アラートモデル

```typescript
interface Alert {
  id: string;
  type: 'temperature' | 'humidity';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: Date;
  isActive: boolean;
}
```

## エラーハンドリング

### エラー分類と対応

1. **SwitchBot API エラー**
   - レート制限超過: 指数バックオフでリトライ
   - 認証エラー: ユーザーに設定確認を促す
   - デバイス未応答: デバイス状態を「オフライン」として表示

2. **ネットワークエラー**
   - 接続タイムアウト: 自動リトライ（最大3回）
   - 接続断: WebSocket再接続処理

3. **データ検証エラー**
   - 不正なセンサー値: 前回値を保持、エラーログ出力
   - 設定値範囲外: デフォルト値に戻す

### エラー表示

```typescript
interface ErrorState {
  hasError: boolean;
  errorMessage: string;
  errorType: 'network' | 'api' | 'validation';
  retryable: boolean;
}
```

## テスト戦略

### テスト分類

1. **ユニットテスト**
   - コンポーネント単体テスト (Jest + React Testing Library)
   - API関数テスト
   - データ変換ロジックテスト

2. **統合テスト**
   - SwitchBot API統合テスト
   - WebSocket通信テスト
   - エンドツーエンドシナリオテスト

3. **E2Eテスト**
   - ダッシュボード表示テスト
   - デバイス制御フローテスト
   - レスポンシブデザインテスト

### テストデータ

```typescript
// モックデータ例
const mockEnvironmentData: EnvironmentData = {
  temperature: 25.4,
  humidity: 62,
  light: 850,
  timestamp: new Date()
};

const mockDevices: Device[] = [
  {
    deviceId: 'light-001',
    deviceName: 'リビング照明',
    deviceType: 'Light',
    status: 'online',
    properties: { power: 'on', brightness: 80 }
  }
];
```

## セキュリティ考慮事項

### API キー管理

```typescript
// 環境変数での管理
const config = {
  switchbot: {
    token: process.env.SWITCHBOT_TOKEN!,
    secret: process.env.SWITCHBOT_SECRET!
  }
};

// 署名生成
function generateSign(token: string, secret: string, nonce: string, timestamp: string): string {
  const data = token + timestamp + nonce;
  return crypto.createHmac('sha256', secret).update(data).digest('base64');
}
```

### CORS設定

```typescript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
};
```

## パフォーマンス最適化

### フロントエンド最適化

1. **コンポーネント最適化**
   - React.memo でレンダリング最適化
   - useMemo, useCallback でメモ化
   - 仮想化リストでデバイス一覧表示

2. **データ管理**
   - 環境データの効率的なメモリ管理
   - 不要なAPI呼び出しの削減

### バックエンド最適化

1. **API呼び出し最適化**
   - SwitchBot APIのレート制限遵守
   - データキャッシュ機能
   - バッチ処理での効率化

2. **WebSocket最適化**
   - 接続プール管理
   - メッセージ圧縮

## デプロイメント設計

### 開発環境

```bash
# フロントエンド
npm run dev          # 開発サーバー起動

# バックエンド  
npm run dev          # 開発サーバー起動
npm run test         # テスト実行
```

### 本番環境

```bash
# ビルド
npm run build        # フロントエンド・バックエンドビルド

# 起動
npm start           # 本番サーバー起動
```

### 環境変数設定

```bash
# .env ファイル例
SWITCHBOT_TOKEN=your_token_here
SWITCHBOT_SECRET=your_secret_here
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```