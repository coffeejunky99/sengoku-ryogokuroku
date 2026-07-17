# Phase03 時間進行

## 1. 目的

リアルタイム領国経営の基礎となる250ミリ秒固定simulation step、ゲーム内日付、一時停止、1倍速、2倍速、4倍速、自動停止、background停止を実装する。

Phase03では描画フレームと権威的シミュレーションを分離し、端末FPSとrequestAnimationFrameの呼び出し分割に依存しない決定的な時間進行を成立させる。

---

## 2. 参照文書

実装前に以下を読む。

- `AGENTS.md`
- `docs/codex/README.md`
- `docs/GDD/GDD.md`
- `docs/GDD/縦切り試作データ一覧_v0.1.md`
- `docs/design/data-design.md`
- `docs/design/technical-design.md`
- 直前Phaseの完了報告

GDDに存在しない仕様は実装しない。

Phase03は時間進行だけを対象とする。Phase02のMapDefinition、全国マップ、城・街道データを変更せず、描画フレームとシミュレーション更新の分離に必要な連携だけを行う。

---

## 3. 正式仕様

### 3.1 時間定数

```ts
const SIMULATION_STEP_MS = 250;
const SIMULATION_TICKS_PER_GAME_DAY = 4;
const MAX_SIMULATION_TICKS_PER_FRAME = 8;

type TimeScale = 0 | 1 | 2 | 4;
```

- 4 simulation tickでゲーム内時間が1日進む。
- 1倍速では実時間1秒でゲーム内1日進む。
- 2倍速では実時間1秒でゲーム内2日進む。
- 4倍速では実時間1秒でゲーム内4日進む。
- 0倍速ではsimulation tickを生成しない。

### 3.2 初期日時と表示

- 縦切り試作の開始日は1561-09-01とする。
- GameDateは`year`、`month`、`day`を保持する。
- 初期timeScaleは`0`とする。
- 全国マップUIへ現在年月日と現在速度を常時表示する。
- 日付表示形式は`YYYY/MM/DD`とする。
- ゲーム内暦は一般的な西暦の月日・閏年規則を使用する。
- 歴史的な旧暦の再現はPhase03および縦切り試作の対象外とする。
- JavaScript `Date`および端末timezoneへ依存しない。
- GameDateの検証と加算はDomainの純粋関数で行う。

### 3.3 手動速度変更

- プレイヤーは0倍速、1倍速、2倍速、4倍速を明示的に選択する。
- 通常の手動速度変更ではaccumulatorを維持する。
- 速度変更操作だけではsimulation tickを即時生成せず、ゲーム内日付を進めない。
- 自動停止後は以前の速度へ自動復帰しない。
- プレイヤーが速度を再選択するまで0倍速を維持する。

### 3.4 一時停止中の操作

- 0倍速ではsimulation tickだけを停止する。
- 一時停止中もReact UIとPhaser描画を継続する。
- 一時停止中も全国マップのパン、ズーム、城選択を操作可能とする。

---

## 4. 開始条件

- 直前Phaseが完了している。
- `npm run lint`が成功する。
- `npm run typecheck`が成功する。
- `npm run test`が成功する。
- `npm run build`が成功する。
- 未解決の重大エラーがない。
- 250ミリ秒固定step、4tick/日、0/1/2/4倍速がGDDと設計書で一致している。
- 開始日1561-09-01、初期速度0、一般的な西暦暦、`YYYY/MM/DD`表示が確定している。
- 最大8tick/frame、background停止・破棄・復帰後0倍速がtechnical-designで確定している。
- 自動停止7条件と初期値`true`がGDDとdata-designで一致している。
- 実装対象と対象外が確認されている。

条件を満たさない場合は開始しない。

---

## 5. 実装対象

- `TimeScale`
- `GameDate`
- `AutoPauseReason`
- GameDate検証
- GameDate加算
- Application層のfixed-step runner
- 速度変更Application処理
- 重要通知による自動停止Application処理
- プレイヤーの意思決定による共通停止要求契約
- gameStoreの`currentDate`と`timeScale`
- settingsStoreの自動停止設定
- React時間HUD
- 0/1/2/4速度操作
- React側のrequestAnimationFrame hook
- `visibilitychange`による停止
- StrictModeで二重loopを起こさないcleanup
- Unit Test
- Integration Test
- E2E

---

## 6. 実装対象外

- MapDefinition変更
- 全国マップ構造の変更
- 城・街道データ変更
- 内政処理
- 外交処理
- 軍事処理
- 武将処理
- AI
- 合戦処理
- 歴史イベント処理
- 自動停止条件を実際に発生させる外交、戦闘、イベント、資金判定
- 後続画面からプレイヤー意思決定停止を呼び出す処理
- RngStateの具体型
- RNGアルゴリズム
- 乱数生成処理
- SaveRepository
- IndexedDB
- SQLite
- schema migration
- セーブデータ復旧
- ロード直後の時間速度に関する保存・復元処理
- Phaser `update()`によるsimulation駆動
- 新規依存ライブラリ

---

## 7. 推奨実装順序

1. `time-domain-contract`
2. `fixed-step-runner`
3. `time-state-commands`
4. `game-date-progression`
5. `time-ui-loop`
6. `background-auto-pause`
7. `phase03-verification`

各Bundleは一つの機能単位として実装・検証し、後続Bundleや後続Phaseの機能を先行実装しない。

---

## 8. アーキテクチャ方針

### 8.1 fixed-step runner

- requestAnimationFrameはReact側の専用hookが所有する。
- rAF deltaをApplication層のfixed-step runnerへ渡す。
- Domainへ渡す値は非負整数のsimulation tick数だけとする。
- 実時間deltaをDomainの権威的入力にしない。
- `accumulatorMs`と前回frame timestampはrunner内部のruntime状態とする。
- `timeScale`が`0`の場合はaccumulatorへdeltaを追加しない。
- 1frameで処理するsimulation tickは最大8とする。
- foreground中に8tickを超えた未処理分はaccumulatorへ保持する。
- Phaser `update()`を権威的シミュレーションの起点にしない。
- `setInterval`を使用しない。
- 再帰的`setTimeout`を使用しない。
- MapSceneやPhaser Bridgeへ毎frameのdeltaまたはsimulation tickを送らない。

### 8.2 background lifecycle

- documentが非表示になった時点で`timeScale`を`0`へ変更する。
- background移行時はaccumulator、未処理tick、前回frame timestampを破棄する。
- background滞在時間をゲーム内時間へ加算しない。
- foreground復帰後も0倍速を維持する。
- 自動再開しない。
- background停止は設定で無効化できない。
- cleanupでrequestAnimationFrameをキャンセルし、`visibilitychange` listenerを解除する。
- React StrictModeのeffect再実行時もrequestAnimationFrame loopを二重起動しない。

### 8.3 決定性

同じ初期GameState、同じ速度変更列、同じsimulation tick列を与えた場合、描画FPS、端末性能、requestAnimationFrameの呼び出し分割にかかわらず同じ結果を生成することを決定性の正式な定義とする。

- Phase03ではRNGを使用しない。
- Phase03の決定性テストは時間状態だけを対象とする。

---

## 9. 自動停止契約

### 9.1 重要通知

正式なAutoPauseReasonは次の7種類とする。

| **AutoPauseReason** | **表示上の意味** |
|---------------------|------------------|
| `declaration_of_war` | 宣戦布告 |
| `enemy_entry` | 敵軍の領内侵入 |
| `battle_start` | 合戦開始 |
| `siege_start` | 城の包囲 |
| `important_death` | 大名または重要武将の死亡 |
| `historical_event` | 歴史イベント |
| `low_treasury` | 資金が一定値未満 |

- 7条件は初期状態ですべて有効とする。
- 有効な条件の停止要求では`timeScale`を`0`へ変更する。
- 無効な条件では自動停止しない。
- 通知を閉じても以前の速度へ自動復帰しない。
- Phase03では停止を要求できる型とApplication契約までを実装する。

### 9.2 プレイヤーの意思決定

次の画面または操作から使用する共通停止要求契約を定義する。

- 内政コマンド選択
- 外交コマンド選択
- 軍事コマンド選択
- 武将への命令
- 選択肢を伴うイベント
- プレイヤーの意思決定を必要とする確認画面

プレイヤー意思決定の停止理由はAutoPauseReasonへ追加しない。各React画面は時間状態を直接変更せず、Application層の共通停止処理を経由する。

画面を閉じても以前の速度へ自動復帰しない。実際の画面からの呼び出しは各後続Phaseで実装する。

単なる情報表示、ツールチップ、軽微なトースト通知では原則停止しない。どの通知を軽微とするかは各通知仕様で正式に決定する。

---

## 10. データ・保存境界

将来保存対象となる権威的状態は次のとおりとする。

- `currentDate`
- `timeScale`
- 自動停止設定

保存しないruntime状態は次のとおりとする。

- `accumulatorMs`
- requestAnimationFrame ID
- 前回frame timestamp
- document visibility状態
- background移行時刻
- 未処理の描画delta

Phase03では保存処理を実装しない。ロード直後の時間速度に関する保存・復元仕様は、セーブ機能を扱うPhaseで正式に決定する。新規ゲーム開始時の初期速度は`0`とする。

---

## 11. テスト内容

### Unit Test

- `TimeScale`が0/1/2/4だけを許可する。
- 250ミリ秒固定stepでtickを生成する。
- 4tickでGameDateが1日進む。
- 0倍速でtickを生成せず、accumulatorへdeltaを追加しない。
- 1倍速で実時間1秒当たり1日進む。
- 2倍速で実時間1秒当たり2日進む。
- 4倍速で実時間1秒当たり4日進む。
- 1frameの処理を8tickへ制限し、超過分を保持する。
- 通常の手動速度変更でaccumulatorを維持する。
- 速度変更だけでは日付を進めない。
- GameDateの正常値、月末、年末、閏年、無効値を検証する。
- 同じ初期状態、速度変更列、tick列から同じ日付結果を生成する。
- AutoPauseReasonと設定を正しく照合する。

### Integration Test

- UI操作でgameStoreの`timeScale`が変わる。
- tick処理でgameStoreの`currentDate`が変わる。
- 有効なAutoPauseReasonで0倍速になる。
- 無効なAutoPauseReasonでは速度を変更しない。
- プレイヤー意思決定の共通停止要求で0倍速になる。
- background移行時に0倍速となり、runtime状態を破棄する。
- foreground復帰後も0倍速を維持する。
- 停止中もReact UIとPhaser描画が継続する。
- 停止中も城選択、パン、ズームが動作する。
- Bridgeへframe deltaやsimulation tickを送信しない。
- StrictModeでrequestAnimationFrame loopが二重起動しない。
- cleanup後にrequestAnimationFrameと`visibilitychange` listenerが残らない。

### E2E

- 0/1/2/4倍速ボタンを操作できる。
- 初期日付を`1561/09/01`と表示する。
- 初期速度が0倍速である。
- 表示日付が`YYYY/MM/DD`形式で進行する。
- 停止中に日付が進まない。
- 停止中も全国マップの城選択、パン、ズームが動作する。
- background滞在時間を日付へ加算しない。
- foreground復帰後も0倍速を維持する。
- requestAnimationFrameの呼び出し分割や端末FPSでsimulation結果が変わらない。
- MapDefinitionとPhase02全国マップの挙動が維持される。

---

## 12. 完了条件

- 250ミリ秒固定stepで進行する。
- 4tickでゲーム内時間が1日進む。
- 0/1/2/4倍速が動作する。
- 初期日付が1561-09-01である。
- 初期速度が0である。
- 全国マップUIへ`YYYY/MM/DD`形式の日付と現在速度を表示する。
- GameDateが一般的な西暦の月日・閏年規則で検証・加算される。
- JavaScript `Date`と端末timezoneへ依存しない。
- 重要通知による停止要求基盤が動作する。
- プレイヤー意思決定による共通停止要求基盤が動作する。
- 自動停止後に以前の速度へ自動復帰しない。
- background滞在時間をゲーム内時間へ加算しない。
- foreground復帰後も0倍速を維持する。
- 1frameの処理を最大8tickに制限し、foreground中の超過分を保持する。
- 同じ初期GameState、速度変更列、tick列からFPSやrAF分割に依存しない同一結果を生成する。
- 停止中もReact UI、Phaser描画、城選択、パン、ズームが動作する。
- StrictModeでrequestAnimationFrame loopが二重起動しない。
- cleanup後にrequestAnimationFrameと`visibilitychange` listenerが残らない。
- RNGを使用・実装していない。
- MapDefinition、城・街道データ、Phase02全国マップに差分がない。
- 新規依存ライブラリを追加していない。
- `npm run lint`、`npm run typecheck`、`npm run test`、`npm run build`、`npm run test:e2e`が成功する。

---

## 13. Codexへの禁止事項

- JavaScript `Date`または端末timezoneへ日付計算を依存させる。
- requestAnimationFrameのdeltaをDomainへ直接渡す。
- Phaser `update()`を権威的シミュレーションの起点にする。
- `setInterval`または再帰的`setTimeout`でゲーム進行を実装する。
- MapSceneやPhaser Bridgeへ毎frameのdeltaまたはsimulation tickを送信する。
- FPS依存の結果を作る。
- 自動停止後に以前の速度へ自動復帰させる。
- background滞在時間をゲーム内時間へ加算する。
- RNG、保存、AI、内政、外交、軍事、武将、合戦を先行実装する。
- MapDefinition、城・街道データ、Phase02全国マップを変更する。
- 新規依存ライブラリを追加する。

---

## 14. 完了報告形式

1. 問題の整理
2. 実装方針
3. 実装内容
4. 影響範囲
5. テスト内容
6. 完了条件

満たしていない条件がある場合は未完了として報告する。
