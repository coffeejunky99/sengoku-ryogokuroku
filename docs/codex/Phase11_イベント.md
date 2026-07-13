# Phase11 イベント

## 1. 目的

構造化された歴史イベントの条件評価・選択肢・効果適用を実装する。

---

## 2. 参照文書

実装前に以下を読む。

- `AGENTS.md`
- `docs/codex/README.md`
- `docs/GDD/GDD.md`
- `docs/design/data-design.md`
- `docs/design/technical-design.md`
- 直前Phaseの完了報告

GDDに存在しない仕様は実装しない。

---

## 3. 開始条件

- 直前Phaseが完了している
- `npm run lint` が成功する
- `npm run typecheck` が成功する
- `npm run test` が成功する
- `npm run build` が成功する
- 未解決の重大エラーがない
- 対象機能に必要な仕様がGDDに存在する

条件を満たさない場合は開始しない。

---

## 4. 実装対象

- HistoricalEventDefinition
- 発火条件
- 一度限り制御
- 選択肢
- 効果適用
- イベント履歴
- イベントUI
- 自動停止
- 3歴史イベントの登録基盤

---

## 5. 実装対象外

- 任意スクリプト実行
- 大量の正式イベント
- 分岐シナリオ販売
- GDD未確定のイベント本文・効果を独断作成

---

## 6. 実装順序

1. Event schema
2. Condition evaluator
3. Effect applier
4. Trigger scheduler
5. oncePerGame
6. Event history
7. React modal
8. 自動停止
9. 3イベントデータ投入
10. テスト

---

## 7. アーキテクチャ方針

- 条件・効果はtype別の登録済みhandler
- eval禁止
- tick終了後に安全に発火
- 効果適用は一括処理
- UIは選択肢表示とCommand発行のみ

---

## 8. データ・状態管理

- eventId一意
- oncePerGame履歴
- 選択肢ID一意
- nextEventId参照検証
- 正式本文と効果はGDD承認済みのみ

---

## 9. テスト内容

### Unit
- 条件評価
- oncePerGame
- 効果適用
- 無効参照
- 複数条件
- 分岐

### Integration
- 時間進行から発火
- 自動停止
- UI選択
- 状態反映
- 履歴保存

### E2E
- イベント表示
- 選択肢
- 効果反映
- 再発火防止

---

## 10. 完了条件

- 構造化イベントが動作する
- 3イベントを登録可能
- 自動停止と履歴が動作する
- 任意コード実行がない
- lint/typecheck/test/build/e2eが成功する

---

## 11. Codexへの禁止事項

- evalを使う
- イベント本文を創作する
- 効果をUIへ直書きする
- oncePerGame管理を省略する

---

## 12. 完了報告形式

1. 問題の整理
2. 実装方針
3. 実装内容
4. 影響範囲
5. テスト内容
6. 完了条件

満たしていない条件がある場合は未完了として報告する。
