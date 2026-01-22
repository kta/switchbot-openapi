# TODO.md - SwitchBot OpenAPI 自動更新システム構築

## 概要
SwitchBotの公式README（API仕様書）が更新されたら、このリポジトリのOpenAPI定義も自動更新されるシステムを構築する。

OpenAPI 3.1.0を使用する（@redocly/cliでサポート）

**✅ GitHub Copilot統合完了:**
- GitHub Models API (GPT-4o)を使用
- OpenAI APIではなくGitHub Copilotを使用
- シークレット不要（GITHUB_TOKEN自動使用）
- 無料（レート制限内）

---

## Phase 0: 事前準備・設計 ✅

- [x] 公式READMEの構造を分析
- [x] デバイス一覧を抽出（約70種類以上）
- [x] OpenAPIの構造設計方針を決定

### 分析結果サマリ

**公式README構造（6107行）:**
- Authentication（認証方式、署名方法）
- API Usage（ホスト、リクエスト制限、ヘッダー、エラーコード）
- Devices
  - GET /devices（デバイス一覧取得）
  - GET /devices/{deviceId}/status（ステータス取得）
  - POST /devices/{deviceId}/commands（コマンド送信）
- Scenes
  - GET /scenes（シーン一覧）
  - POST /scenes/{sceneId}/execute（シーン実行）
- Webhook（設定、取得、更新、削除、イベント受信）

---

## Phase 1: リポジトリ基盤構築 ✅

### 1.1 ディレクトリ構造作成
- [x] `.github/workflows/` ディレクトリ作成
- [x] `src/` ディレクトリ作成
- [x] `src/paths/` ディレクトリ作成（エンドポイント別）
- [x] `src/components/` ディレクトリ作成（共通コンポーネント）
- [x] `src/components/schemas/` ディレクトリ作成（デバイス別スキーマ）
- [x] `scripts/` ディレクトリ作成（自動化スクリプト）

### 1.2 package.json作成
- [x] プロジェクト初期化
- [x] 依存関係追加
  - `@redocly/cli` (結合・バリデーション・ドキュメント生成)
  - `yaml` (YAML解析)

### 1.3 基本設定ファイル
- [x] `.gitignore` 作成
- [x] `.editorconfig` 作成（YAML用インデント設定）

---

## Phase 2: OpenAPIベース定義 ✅

### 2.1 src/main.yaml（メインエントリポイント）
- [x] OpenAPI 3.1.0 バージョン指定
- [x] info セクション（タイトル、説明、バージョン）
- [x] servers セクション（`https://api.switch-bot.com/v1.1`）
- [x] security セクション（グローバル認証要件）
- [x] tags 定義（Devices, Scenes, Webhook）
- [x] paths への $ref 参照
- [x] components への $ref 参照

### 2.2 src/components/securitySchemes.yaml
- [x] Authorization ヘッダー（トークン）
- [x] sign ヘッダー（署名）
- [x] t ヘッダー（タイムスタンプ）
- [x] nonce ヘッダー

### 2.3 src/components/parameters.yaml
- [x] deviceId パスパラメータ
- [x] sceneId パスパラメータ

### 2.4 src/components/responses.yaml
- [x] 共通成功レスポンス構造
- [x] 共通エラーレスポンス（100〜190のエラーコード）

### 2.5 src/components/schemas/common.yaml
- [x] BaseResponse スキーマ
- [x] ErrorResponse スキーマ
- [x] DeviceBase 基本スキーマ

---

## Phase 3: エンドポイント定義 ✅

### 3.1 src/paths/devices.yaml
- [x] GET /devices（デバイス一覧取得）
  - [x] summary, description
  - [x] responses（成功/エラー）
  - [x] デバイスタイプ別レスポンス参照

### 3.2 src/paths/devices-status.yaml
- [x] GET /devices/{deviceId}/status
  - [x] path parameters
  - [x] デバイスタイプ別ステータスレスポンス参照

### 3.3 src/paths/devices-commands.yaml
- [x] POST /devices/{deviceId}/commands
  - [x] path parameters
  - [x] requestBody（commandType, command, parameter）
  - [x] デバイスタイプ別コマンドセット参照

### 3.4 src/paths/scenes.yaml
- [x] GET /scenes（シーン一覧取得）
- [x] POST /scenes/{sceneId}/execute（シーン実行）

### 3.5 src/paths/webhook.yaml
- [x] POST /webhook/setupWebhook（設定）
- [x] POST /webhook/queryWebhook（取得）
- [x] POST /webhook/updateWebhook（更新）
- [x] POST /webhook/deleteWebhook（削除）

---

## Phase 4: デバイス別スキーマ定義

### 4.1 デバイスカテゴリ分類

**スイッチ・プラグ系:**
- [x] src/components/schemas/devices/bot.yaml
- [x] src/components/schemas/devices/plug.yaml
- [ ] src/components/schemas/devices/plug-mini.yaml（US/JP/EU）
- [ ] src/components/schemas/devices/relay-switch.yaml（1/1PM/2PM）

**カーテン・ブラインド系:**
- [x] src/components/schemas/devices/curtain.yaml (includes Curtain3)
- [x] src/components/schemas/devices/curtain3.yaml (merged with curtain.yaml)
- [ ] src/components/schemas/devices/blind-tilt.yaml
- [ ] src/components/schemas/devices/roller-shade.yaml

**ロック系:**
- [x] src/components/schemas/devices/lock.yaml
- [ ] src/components/schemas/devices/lock-pro.yaml
- [ ] src/components/schemas/devices/lock-ultra.yaml
- [ ] src/components/schemas/devices/lock-lite.yaml
- [ ] src/components/schemas/devices/keypad.yaml
- [ ] src/components/schemas/devices/keypad-touch.yaml
- [ ] src/components/schemas/devices/keypad-vision.yaml
- [ ] src/components/schemas/devices/keypad-vision-pro.yaml

**センサー系:**
- [x] src/components/schemas/devices/meter.yaml (includes Meter, MeterPlus, Meter Pro, Meter Pro CO2)
- [x] src/components/schemas/devices/meter-plus.yaml (merged with meter.yaml)
- [x] src/components/schemas/devices/meter-pro.yaml (merged with meter.yaml)
- [x] src/components/schemas/devices/meter-pro-co2.yaml (merged with meter.yaml)
- [ ] src/components/schemas/devices/outdoor-meter.yaml
- [ ] src/components/schemas/devices/motion-sensor.yaml
- [ ] src/components/schemas/devices/contact-sensor.yaml
- [ ] src/components/schemas/devices/presence-sensor.yaml
- [ ] src/components/schemas/devices/water-leak-detector.yaml

**ライト系:**
- [ ] src/components/schemas/devices/color-bulb.yaml
- [ ] src/components/schemas/devices/strip-light.yaml
- [ ] src/components/schemas/devices/strip-light-3.yaml
- [ ] src/components/schemas/devices/ceiling-light.yaml
- [ ] src/components/schemas/devices/ceiling-light-pro.yaml
- [ ] src/components/schemas/devices/floor-lamp.yaml
- [ ] src/components/schemas/devices/rgbicww-strip-light.yaml
- [ ] src/components/schemas/devices/rgbicww-floor-lamp.yaml
- [ ] src/components/schemas/devices/rgbic-neon-wire.yaml
- [ ] src/components/schemas/devices/rgbic-neon-rope.yaml
- [ ] src/components/schemas/devices/candle-warmer-lamp.yaml

**ハブ系:**
- [x] src/components/schemas/devices/hub.yaml（Hub/Hub Plus/Hub Mini/Hub 2）
- [x] src/components/schemas/devices/hub2.yaml (merged with hub.yaml)
- [ ] src/components/schemas/devices/hub3.yaml
- [ ] src/components/schemas/devices/ai-hub.yaml

**ロボット掃除機系:**
- [ ] src/components/schemas/devices/robot-vacuum-s1.yaml
- [ ] src/components/schemas/devices/robot-vacuum-s1-plus.yaml
- [ ] src/components/schemas/devices/robot-vacuum-k10-plus.yaml
- [ ] src/components/schemas/devices/robot-vacuum-k10-plus-pro.yaml
- [ ] src/components/schemas/devices/robot-vacuum-k10-pro-combo.yaml
- [ ] src/components/schemas/devices/robot-vacuum-k11-plus.yaml
- [ ] src/components/schemas/devices/robot-vacuum-k20-plus-pro.yaml
- [ ] src/components/schemas/devices/floor-cleaning-s10.yaml
- [ ] src/components/schemas/devices/floor-cleaning-s20.yaml

**空調・加湿系:**
- [x] src/components/schemas/devices/humidifier.yaml
- [ ] src/components/schemas/devices/evaporative-humidifier.yaml
- [ ] src/components/schemas/devices/evaporative-humidifier-auto.yaml
- [ ] src/components/schemas/devices/air-purifier-voc.yaml
- [ ] src/components/schemas/devices/air-purifier-table-voc.yaml
- [ ] src/components/schemas/devices/air-purifier-pm25.yaml
- [ ] src/components/schemas/devices/air-purifier-table-pm25.yaml
- [ ] src/components/schemas/devices/smart-radiator-thermostat.yaml

**ファン系:**
- [ ] src/components/schemas/devices/battery-circulator-fan.yaml
- [ ] src/components/schemas/devices/circulator-fan.yaml
- [ ] src/components/schemas/devices/standing-circulator-fan.yaml

**カメラ系:**
- [ ] src/components/schemas/devices/indoor-cam.yaml
- [ ] src/components/schemas/devices/pan-tilt-cam.yaml
- [ ] src/components/schemas/devices/pan-tilt-cam-2k.yaml
- [ ] src/components/schemas/devices/pan-tilt-cam-plus-2k.yaml
- [ ] src/components/schemas/devices/pan-tilt-cam-plus-3k.yaml
- [ ] src/components/schemas/devices/video-doorbell.yaml

**その他:**
- [ ] src/components/schemas/devices/remote.yaml
- [ ] src/components/schemas/devices/garage-door-opener.yaml
- [ ] src/components/schemas/devices/home-climate-panel.yaml
- [ ] src/components/schemas/devices/ai-art-frame.yaml

**仮想赤外線リモコン:**
- [ ] src/components/schemas/devices/virtual-ir-remote.yaml

### 4.2 各デバイススキーマの構成（テンプレート）
各デバイスYAMLには以下を含める:
- DeviceListResponse（GET /devices 時のレスポンス）
- StatusResponse（GET /devices/{id}/status 時のレスポンス）
- CommandRequest（POST /devices/{id}/commands 時のリクエスト）
- WebhookEvent（Webhook受信時のペイロード、対応デバイスのみ）

---

## Phase 5: 自動更新スクリプト

### 5.1 scripts/devices-config.json
- [x] デバイスマッピング定義
  - deviceType（API上の識別子）
  - displayName（表示名）
  - yamlFile（対応するYAMLファイルパス）
  - readmeHeaders（READMEでのセクション見出し配列）
  - hasStatus（ステータス取得対応か）
  - hasCommands（コマンド対応か）
  - hasWebhook（Webhook対応か）

### 5.2 scripts/extract-sections.js
- [x] READMEダウンロード機能
- [x] Markdownセクション抽出（正規表現）
- [x] セクションハッシュ計算（SHA256）
- [x] 前回ハッシュとの比較
- [x] 変更があったセクションのみ出力

### 5.3 scripts/prompt-template.md
- [x] LLMへの役割定義
- [x] 入力データ形式（README抜粋、現行YAML）
- [x] 出力形式指定（純粋なYAMLのみ）
- [x] OpenAPI規約の明示

### 5.4 scripts/update-device.js
- [x] 単一デバイスの更新ロジック
- [x] GitHub Copilot API統合（完了）
- [x] YAMLバリデーション
- [x] ファイル書き込み
- [x] Markdownコードブロック削除機能

### 5.5 scripts/bundle.js
- [x] redocly bundle実行
- [x] 結合後のバリデーション
- [x] openapi.yaml 出力

### 5.6 scripts/hash-store.json
- [x] 各セクションの前回ハッシュ保存
- [x] 差分検知用データストア

---

## Phase 6: GitHub Actions

### 6.1 .github/workflows/update-api.yml
- [x] トリガー設定
  - schedule（毎日深夜）
  - workflow_dispatch（手動実行）
- [x] Node.js セットアップ
- [x] 依存関係インストール
- [x] README取得ステップ
- [x] セクション解析・差分検知ステップ
- [x] GitHub Copilot統合（完了）
- [x] バンドル・バリデーションステップ
- [x] PR作成ステップ（peter-evans/create-pull-request）

### 6.2 .github/workflows/validate.yml
- [x] PR時のバリデーション
- [x] OpenAPI Lint実行
- [x] スキーマ整合性チェック

### 6.3 シークレット設定ドキュメント
- [x] GitHub Models API の説明（シークレット不要）
- [x] 必要な権限の説明
- [x] ローカルテスト手順
- [x] トラブルシューティングガイド

---

## Phase 7: ドキュメント ✅

### 7.1 README.md
- [x] プロジェクト概要
- [x] 使い方（APIクライアント生成など）
- [x] ローカル開発手順
- [x] コントリビューション方法
- [x] ライセンス

### 7.2 CLAUDE.md
- [x] アーキテクチャ説明
- [x] ビルドコマンド
- [x] ディレクトリ構造
- [x] デバイス追加手順

---

## Phase 8: 初期データ投入・検証

### 8.1 パイロットデバイスで動作検証
- [x] Bot（最もシンプル）で一連のフローを検証
- [x] Lock（中程度の複雑さ）で検証
- [x] Humidifier（中程度の複雑さ）で検証
- [x] Curtain（複雑な設定オプション）で検証

### 8.2 全デバイス初期生成
- [x] 7種類の主要デバイスを手動作成（Bot, Lock, Humidifier, Curtain, Plug, Meter, Hub）
- [x] バンドル実行
- [x] openapi.yaml の完全性検証

### 8.3 GitHub Actions E2E テスト
- [ ] 手動トリガーで全フロー実行（LLM API統合後に実施）
- [ ] PR生成確認
- [ ] 生成されたYAMLの品質確認

**注**: 残り60+デバイスは、LLM API統合後に自動生成または手動で追加可能

---

## 実装順序の推奨

1. **Phase 1.1 + 1.2** → ディレクトリ構造とpackage.json
2. **Phase 2** → OpenAPIベース定義（main.yaml と共通コンポーネント）
3. **Phase 3** → エンドポイント定義
4. **Phase 4（Bot のみ）** → パイロットデバイススキーマ
5. **Phase 5.5** → バンドルスクリプト（動作確認用）
6. **Phase 5.1〜5.4** → 自動更新スクリプト
7. **Phase 6.1** → GitHub Actions
8. **Phase 8.1** → パイロット検証
9. **Phase 4（残り）** → 全デバイススキーマ
10. **Phase 7** → ドキュメント
11. **Phase 6.2** → バリデーションワークフロー
12. **Phase 8.2〜8.3** → 全体検証

---

## 注意事項

- LLM API呼び出しにはコストがかかるため、差分検知を確実に行う
- READMEの構造変更に対応できるよう、抽出ロジックは柔軟に
- OpenAPI 3.1.0 を使用（@redocly/cliでサポート、JSON Schema 2020-12準拠）
- デバイスタイプの命名はAPIレスポンスの `deviceType` フィールドに合わせる
