# Phase03 時間進行

## 1. 目的

リアルタイム領国経営の基礎となる時間停止・1倍速・2倍速・4倍速と固定時間ステップを実装する。

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

- SimulationClock
- 固定時間ステップ
- 0x / 1x / 2x / 4x
- ゲーム内年月日の更新
- Reactの速度操作UI
- バックグラウンド時の自動停止
- 自動停止イベントの基盤
- 決定的シミュレーション

---

## 5. 実装対象外

- 内政完了効果
- AIターン処理
- 行軍
- 戦闘
- 歴史イベント
- 正式なゲーム速度数値の独断決定

---

## 6. 実装順序

1. SimulationClock型定義
2. 固定tick runner
3. 時間倍率切替
4. ゲーム日付更新
5. 自動停止イベント基盤
6. React操作UI
7. Phaser描画との分離
8. 非アクティブ時停止
9. 決定性テスト

---

## 7. アーキテクチャ方針

- 描画フレームとsimulation tickを分離する
- Domainへ経過tickを渡す
- timeScaleはgameStoreで管理する
- requestAnimationFrameの差分時間を直接ゲーム結果に使わない
- 1フレーム当たりの最大tick数を制限する

---

## 8. データ・状態管理

- `currentDate`をGameStateへ保持する
- `timeScale`は0/1/2/4のunion
- RNG状態は将来保存可能な型で用意する
- 時間関連マジックナンバーは定数化する

---

## 9. テスト内容

### Unit
- 各倍率のtick数
- 停止中に日付が進まない
- 大きなdeltaの上限制御
- 同じ入力で同じ日付結果

### Integration
- UI操作でtimeScaleが変わる
- バックグラウンドで停止する
- Bridge描画は継続する

### E2E
- 0/1/2/4倍速ボタン
- 表示日付の進行
- タブ復帰後の暴走がない

---

## 10. 完了条件

- 固定時間ステップで進行する
- 0/1/2/4倍速が動作する
- 停止中もUI操作できる
- 端末FPSで結果が変わらない
- lint/typecheck/test/build/e2eが成功する

---

## 11. Codexへの禁止事項

- setIntervalだけでゲーム進行を実装する
- FPS依存の結果を作る
- 未確定の1日あたり実時間をGDD値として固定する
- AIや内政を先行実装する

---

## 12. 完了報告形式

1. 問題の整理
2. 実装方針
3. 実装内容
4. 影響範囲
5. テスト内容
6. 完了条件

満たしていない条件がある場合は未完了として報告する。
