# Phase01 プロジェクト初期構築

## 1. 目的

『戦国領国録』の縦切り試作を実装するための開発基盤を構築する。

本Phaseでは、ゲーム機能そのものは実装しない。

対象は以下に限定する。

- Vite
- React
- TypeScript
- Phaser
- Zustand
- Vitest
- Playwright
- ESLint
- Capacitor
- 基本ディレクトリ
- 最小限の起動確認
- CI基盤

このPhaseの目的は、後続Phaseを安全に実装できる状態を作ることである。

---

## 2. GDD参照箇所

以下を確認する。

- 対象プラットフォーム
- 技術スタック
- 縦切り試作の対象範囲
- Web、iOS、Android対応
- セーブ方式
- UIのスマートフォン基準
- 60FPS目標

本PhaseではGDDのゲーム仕様を実装しない。

---

## 3. 関連設計書

実装前に以下を読む。

- `AGENTS.md`
- `docs/codex/README.md`
- `docs/GDD/GDD.md`
- `docs/design/data-design.md`
- `docs/design/technical-design.md`

特に以下を確認する。

- レイヤー構成
- 依存方向
- PhaserとReactの責務分離
- Zustandの状態管理方針
- 永続化Repositoryの抽象化
- TypeScript strict
- テスト戦略
- ディレクトリ構成

---

## 4. 開始条件

以下を満たしていること。

- リポジトリが作成済み
- Gitが初期化済み
- Node.jsが利用可能
- npmが利用可能
- `AGENTS.md` がリポジトリ直下に存在する
- `docs/` 配下の設計文書が配置済み
- 作業ブランチがmain以外に作成されている

満たしていない場合は、不足項目を先に解消する。

---

## 5. 実装対象

### 5.1 プロジェクト作成

Viteを使用してReact + TypeScriptプロジェクトを作成する。

必須条件:

- React
- TypeScript
- Vite
- strict mode
- ES Modules
- npm scripts整備

### 5.2 Phaser導入

Phaserを依存関係へ追加する。

最小限のPhaser Sceneを作成し、React画面内でcanvasが表示されることを確認する。

このSceneでは以下のみ許可する。

- 背景描画
- 起動確認用テキスト
- resize対応

城、街道、軍団、合戦、ゲームロジックは実装しない。

### 5.3 Zustand導入

Zustandを導入する。

本Phaseでは以下の最小Storeのみ作成する。

- `uiStore`
- `settingsStore`
- `gameStore` の空構造

実際のゲーム状態は持たせない。

例:

```ts
interface UiState {
  readonly isBooted: boolean;
}
```

テスト用・起動確認用以外の状態を追加しない。

### 5.4 テスト環境

Vitestを導入する。

最低限、以下をテストする。

- アプリの基本コンポーネントが描画できる
- Zustand Storeの初期値が取得できる
- Phaser Bridgeの最小イベント購読が動作する

Playwrightを導入する。

最低限、以下をE2Eで確認する。

- トップページが表示される
- React UIが表示される
- Phaser canvasが存在する

### 5.5 Capacitor導入

Capacitorを導入し、Webプロジェクトをラップできる状態にする。

このPhaseでは以下までとする。

- Capacitor初期化
- iOS platform追加
- Android platform追加
- Web buildを同期できる
- 設定ファイルが存在する

実機ビルド・署名・ストア申請は行わない。

### 5.6 Lintと型チェック

ESLintを導入する。

必須条件:

- TypeScript対応
- React Hooks対応
- 未使用変数検出
- `any`使用を許可しない
- import順序または循環依存の検出方針を明示
- `@ts-ignore`を許可しない

型チェック用scriptを追加する。

```json
"typecheck": "tsc --noEmit"
```

### 5.7 CI

GitHub Actionsを追加する。

最低限、以下を実行する。

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

Playwrightは、CI時間や依存の都合で別jobに分けてもよい。

ただしE2E jobを省略してはならない。

---

## 6. 実装対象外

以下は本Phaseで実装しない。

- 全国マップ
- 城データ
- 武将データ
- 大名家データ
- 街道
- 内政
- 外交
- 軍団
- 行軍
- 攻城
- 合戦
- AI
- 歴史イベント
- セーブ・ロード
- IndexedDB実装
- SQLite実装
- 実ゲーム用UI
- 正式アセット
- BGM・SE
- チュートリアル
- ゲームバランス
- 本番用マスターデータ

上記を先行実装してはならない。

---

## 7. 推奨ディレクトリ構成

Phase01完了時点で、最低限以下の構成を作る。

```text
src/
├── app/
│   ├── App.tsx
│   └── providers/
│
├── presentation/
│   ├── react/
│   │   ├── components/
│   │   ├── screens/
│   │   └── hooks/
│   │
│   └── phaser/
│       ├── scenes/
│       ├── bridge/
│       └── config/
│
├── application/
│   ├── commands/
│   ├── queries/
│   ├── use-cases/
│   └── ports/
│
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── services/
│   ├── rules/
│   ├── events/
│   └── types/
│
├── state/
│   ├── game-store.ts
│   ├── ui-store.ts
│   ├── settings-store.ts
│   └── selectors/
│
├── infrastructure/
│   ├── persistence/
│   ├── logging/
│   └── assets/
│
├── data/
│   ├── master/
│   ├── scenarios/
│   └── schemas/
│
└── tests/
    ├── fixtures/
    └── helpers/

e2e/
└── specs/

docs/
├── GDD/
├── design/
└── codex/
```

空ディレクトリ維持のための不要ファイルを大量に作らない。

必要な場合のみ `.gitkeep` を使用する。

---

## 8. 推奨ファイル

最低限、以下を作成する。

```text
src/main.tsx
src/app/App.tsx
src/presentation/phaser/config/create-game-config.ts
src/presentation/phaser/scenes/BootScene.ts
src/presentation/phaser/bridge/game-bridge.ts
src/presentation/react/components/PhaserGame.tsx
src/state/ui-store.ts
src/state/settings-store.ts
src/state/game-store.ts
src/vite-env.d.ts
vite.config.ts
vitest.config.ts
playwright.config.ts
capacitor.config.ts
eslint.config.js
```

ファイル名は既存規約と一致させる。

---

## 9. 実装順序

以下の順序で実装する。

### 9.1 初期化

1. Vite React TypeScriptを作成
2. 不要なサンプルコードを削除
3. strict設定を確認
4. npm scriptsを整備

### 9.2 コード品質

1. ESLint
2. 型チェック
3. importルール
4. 未使用コード検出

### 9.3 React基盤

1. `App.tsx`
2. provider構成
3. エラー境界の最小構造
4. スマートフォンviewport前提の基本レイアウト

### 9.4 Phaser基盤

1. BootScene
2. Phaser config
3. React内canvas
4. resize
5. destroy処理

### 9.5 Bridge基盤

1. 型付きイベントunion
2. subscribe
3. unsubscribe
4. 最小テスト

### 9.6 Zustand基盤

1. uiStore
2. settingsStore
3. gameStore空構造
4. selector配置方針

### 9.7 テスト

1. Vitest
2. React基本テスト
3. Storeテスト
4. Bridgeテスト
5. Playwright smoke test

### 9.8 Capacitor

1. 初期化
2. iOS追加
3. Android追加
4. sync確認

### 9.9 CI

1. GitHub Actions
2. lint
3. typecheck
4. test
5. build
6. e2e

---

## 10. React実装ルール

- `App.tsx`へゲームロジックを書かない
- 起動確認以上のUIを作らない
- 状態変更はStoreまたはApplication層を通す
- Phaser instanceはReact stateへ直接保存しない
- `useEffect` cleanupでPhaser instanceを破棄する
- StrictModeで二重初期化されても破綻しない
- canvasの重複生成を防ぐ
- `document.querySelector`へ依存しない
- refを使用する

---

## 11. Phaser実装ルール

- BootSceneは表示確認のみに使う
- Sceneへゲーム状態を保持しない
- React StoreをSceneから直接変更しない
- Phaser instanceの生成と破棄を明示する
- resize処理を実装する
- canvasの親要素へ追従する
- グローバル変数へinstanceを保存しない
- Hot Reload時の重複起動を防ぐ

---

## 12. Bridge実装ルール

最小限、以下を満たす。

```ts
type GameBridgeEvent =
  | { type: "boot-completed" }
  | { type: "viewport-resized"; width: number; height: number };
```

Bridgeは以下を提供する。

```ts
interface GameBridge {
  emit(event: GameBridgeEvent): void;
  subscribe<TType extends GameBridgeEvent["type"]>(
    type: TType,
    listener: (
      event: Extract<GameBridgeEvent, { type: TType }>
    ) => void
  ): () => void;
}
```

必須条件:

- 任意文字列イベントを使用しない
- listener削除を保証する
- duplicate listenerを許容しない、または仕様を明示する
- React StrictModeでリークしない
- テスト可能である

---

## 13. Zustand実装ルール

### 13.1 uiStore

最低限:

```ts
interface UiState {
  isBooted: boolean;
  setBooted(value: boolean): void;
}
```

### 13.2 settingsStore

最低限:

```ts
interface SettingsState {
  reducedMotion: boolean;
  setReducedMotion(value: boolean): void;
}
```

### 13.3 gameStore

本Phaseでは空の初期構造のみとする。

```ts
interface GameStateStore {
  initialized: boolean;
}
```

ゲームデータ、城、武将、勢力などを追加しない。

---

## 14. npm scripts

最低限、以下を用意する。

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

プロジェクト構成に応じて調整してよい。

ただし意味を変えない。

---

## 15. TypeScript設定

必須:

- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `noFallthroughCasesInSwitch: true`
- `noImplicitReturns: true`
- `useUnknownInCatchVariables: true`

既存テンプレートとの互換性上問題がある場合は、無効化せず原因を整理する。

---

## 16. ESLint方針

最低限、以下を検出する。

- 未使用変数
- 未使用import
- React Hooks違反
- Promiseの未処理
- 不要な型アサーション
- `any`
- 到達不能コード
- fallthrough
- 不正な依存方向

依存方向チェックに追加ツールが必要な場合は、導入前に影響を確認する。

Phase01で無理に新規依存を増やす必要はない。

---

## 17. Vitestテスト項目

### 17.1 React

- Appがクラッシュせず描画される
- Phaser用コンテナが存在する
- 起動状態がUIへ反映される

### 17.2 Zustand

- 初期値が正しい
- actionで状態が更新される
- Store間の不要な依存がない

### 17.3 Bridge

- emitしたイベントを購読者が受け取る
- unsubscribe後は受け取らない
- 異なるevent typeへ通知されない
- 複数購読者が正しく動作する
- cleanup後にlistenerが残らない

### 17.4 Phaser

- config生成関数が有効な設定を返す
- Scene keyが一意である
- DOMがない環境で無理にGameを生成しない

---

## 18. Playwrightテスト項目

最低限、以下を確認する。

1. アプリが起動する
2. エラー画面が表示されない
3. Reactのルート要素が表示される
4. Phaser canvasが1つだけ存在する
5. viewport変更後もcanvasが表示される
6. スマートフォンviewportで横スクロールが発生しない

推奨viewport:

- 390 x 844
- 430 x 932
- 1280 x 720

---

## 19. Capacitor確認項目

以下を確認する。

- `capacitor.config.ts` が存在する
- appIdが仮のまま残っていない
- appNameが『戦国領国録』である
- webDirがVite出力先と一致する
- `npx cap sync` が成功する
- iOSディレクトリが生成される
- Androidディレクトリが生成される

正式なBundle IDが未確定の場合は、仕様不足として明示する。

独断で公開用IDを確定しない。

---

## 20. CI要件

推奨ファイル:

```text
.github/workflows/ci.yml
```

最低限:

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup-node
      - npm ci
      - npm run lint
      - npm run typecheck
      - npm run test
      - npm run build
```

Playwrightは別jobでもよい。

CIでブラウザ依存をインストールする。

---

## 21. パフォーマンス要件

Phase01では計測基盤だけを意識する。

必須:

- Phaser instanceは1つだけ
- React再描画でcanvasを再生成しない
- resize listenerをcleanupする
- Bridge listenerをcleanupする
-不要なintervalを作らない
- 起動時に大量データを読み込まない

正式な性能計測は後続Phaseで行う。

---

## 22. エラー処理

最低限、以下を実装する。

- React Error Boundary
- 起動失敗時の簡易エラー表示
- Phaser初期化失敗の捕捉
- Promise rejectionの未処理防止
- 開発者向けエラーログ

ゲーム用エラー画面のデザインは実装しない。

---

## 23. アクセシビリティ

Phase01で以下を確認する。

- rootに適切な言語設定
- viewport設定
- 基本文字サイズ
- reduced motion設定の保存先だけ用意
- canvasだけで全情報を伝えない構造
- 起動確認UIに適切な見出し

---

## 24. Gitコミット例

推奨分割:

```text
chore(project): initialize vite react typescript
chore(lint): configure eslint and strict typecheck
feat(phaser): add boot scene and react mount
feat(state): add initial zustand stores
test(core): add vitest and playwright smoke tests
chore(capacitor): initialize ios and android platforms
ci: add validation workflow
```

Phase全体を1コミットへまとめない。

---

## 25. 完了条件

以下をすべて満たすこと。

### 基盤

- Vite + React + TypeScriptで起動する
- TypeScript strictが有効
- Phaser canvasがReact内に表示される
- Phaser instanceが重複生成されない
- Zustandが導入されている
- 型付きBridgeが存在する

### テスト

- `npm run lint` が成功
- `npm run typecheck` が成功
- `npm run test` が成功
- `npm run build` が成功
- `npm run test:e2e` が成功

### Capacitor

- Capacitorが初期化済み
- iOS platform追加済み
- Android platform追加済み
- `npx cap sync` が成功

### CI

- GitHub Actionsが存在する
- 必須checkが成功する

### 品質

- `any`がない
- TODOがない
- 仮データが本番コードにない
- 不要なサンプルコードがない
- console.logが残っていない
- 未使用コードがない
- GDDにない機能を実装していない

---

## 26. Codexへの禁止事項

- ゲーム機能を先行実装する
- 城や武将の仮データを本番コードへ追加する
- UIデザインを作り込む
- Zustandへ実ゲーム状態を追加する
- Phaser Sceneへゲームルールを書く
- ReactからPhaser内部を直接操作する
- `any`を使用する
- 型エラーを無視する
- ESLintルールを無効化して通す
- Playwrightを省略する
- Capacitor platform追加を省略する
- CI未作成で完了報告する
- appIdを独断で正式決定する
- 不要なライブラリを追加する
- Phase02以降の機能を実装する

---

## 27. 完了報告形式

Codexは以下の順で報告する。

### 1. 問題の整理

Phase01で構築した基盤を説明する。

### 2. 実装方針

採用した構成と責務分離を説明する。

### 3. 実装内容

変更ファイルと主要設定を列挙する。

### 4. 影響範囲

後続Phaseへの影響と未実装範囲を説明する。

### 5. テスト内容

実行したコマンドと結果を記載する。

### 6. 完了条件

各完了条件を満たしたか明示する。

満たしていない項目がある場合は、Phase01未完了として報告する。
