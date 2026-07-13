**戦国領国録**

**技術設計書 v0.1**

| **項目** | **内容**                                                 |
|----------|----------------------------------------------------------|
| 文書種別 | ソフトウェア技術設計仕様書                               |
| 対象     | 縦切り試作                                               |
| 基準仕様 | 戦国領国録 GDD v0.1                                      |
| 参照設計 | 戦国領国録 データ設計書 v0.1                             |
| 対象技術 | Phaser / React / TypeScript / Zustand / Vite / Capacitor |
| 作成日   | 2026年7月13日                                            |

**本書は実装方法を定義する。ゲーム仕様の追加・変更はGDDでのみ行う。**

# 目次

1\. 目的と適用範囲

2\. 技術目標

3\. 全体アーキテクチャ

4\. レイヤー構成

5\. ディレクトリ構成

6\. モジュール責務

7\. 状態管理

8\. Phaser・React連携

9\. ゲームループと時間進行

10\. 全国マップ

11\. 内政・武将・外交

12\. 軍団・行軍・攻城

13\. 合戦

14\. AIアーキテクチャ

15\. イベントシステム

16\. 永続化

17\. IndexedDB・SQLite抽象化

18\. エラー処理

19\. パフォーマンス

20\. UIアーキテクチャ

21\. モバイル対応

22\. テスト戦略

23\. ビルド・CI

24\. ログ・デバッグ

25\. セキュリティ

26\. アクセシビリティ

27\. バージョニング

28\. 実装フェーズ

29\. 未確定事項

30\. 完了条件

# 1. 目的と適用範囲

本書は『戦国領国録』縦切り試作のソフトウェア構造、責務分離、データフロー、テスト、永続化、モバイル展開を定義する。対象規模はGDDで定義された10城、30武将、4勢力である。

Git管理上の正本は本Markdown版である。DOCX版は人間向けの配布・レビュー用スナップショットとし、差異がある場合はMarkdown版を優先する。

- GDDを唯一のゲーム仕様書として扱う。

- データ設計書をデータ構造の基準として扱う。

- UI、ゲームロジック、描画、永続化を分離する。

- Codexが機能単位で安全に変更できる構造を優先する。

# 2. 技術目標

| **優先度** | **目標**       | **判定基準**                             |
|------------|----------------|------------------------------------------|
| 1          | 保守性         | 責務ごとに分割され、変更範囲が限定される |
| 2          | 可読性         | strict型、明確な命名、循環依存なし       |
| 3          | 拡張性         | 全国規模・複数シナリオへ拡張可能         |
| 4          | テスト容易性   | ドメインロジックがPhaser・Reactから独立  |
| 5          | パフォーマンス | 通常時60FPS、最低30FPS                   |

- TypeScript strictを必須とし、anyは禁止する。

- ゲームロジックをReactコンポーネントやPhaser Sceneへ直接書かない。

- 副作用は境界層へ閉じ込める。

- 同一入力に対して同一結果を返す純粋関数を優先する。

# 3. 全体アーキテクチャ

> Presentation  
> ├─ React UI  
> └─ Phaser Rendering  
> │  
> Application  
> ├─ Use Cases  
> ├─ Commands  
> └─ Queries / Selectors  
> │  
> Domain  
> ├─ Entities / Value Objects  
> ├─ Rules / Calculators  
> ├─ AI  
> └─ Events  
> │  
> Infrastructure  
> ├─ Data Loader  
> ├─ IndexedDB  
> ├─ SQLite  
> ├─ Asset Loader  
> └─ Logging

依存方向はPresentation → Application → Domainとする。InfrastructureはApplicationまたはDomainで定義したinterfaceを実装する。DomainからReact、Phaser、Capacitorへ依存してはならない。

# 4. レイヤー構成

| **レイヤー**   | **責務**                               | **禁止事項**           |
|----------------|----------------------------------------|------------------------|
| Presentation   | 画面表示、入力受付、描画               | ゲームルールの直接実装 |
| Application    | ユースケース実行、トランザクション境界 | UI固有処理             |
| Domain         | ルール、計算、状態遷移、AI判断         | 外部API・DBアクセス    |
| Infrastructure | 保存、読込、ログ、端末機能             | ゲーム仕様の判断       |

ドメインロジックはフレームワーク非依存とし、Vitestだけで検証可能にする。

# 5. ディレクトリ構成

> src/  
> app/  
> App.tsx  
> providers/  
> routes/  
> presentation/  
> react/  
> components/  
> screens/  
> hooks/  
> phaser/  
> scenes/  
> objects/  
> systems/  
> bridge/  
> application/  
> commands/  
> queries/  
> use-cases/  
> ports/  
> domain/  
> entities/  
> value-objects/  
> services/  
> rules/  
> ai/  
> events/  
> types/  
> state/  
> game-store.ts  
> ui-store.ts  
> selectors/  
> data/  
> master/  
> scenarios/  
> schemas/  
> infrastructure/  
> persistence/  
> indexeddb/  
> sqlite/  
> migrations/  
> logging/  
> assets/  
> tests/  
> fixtures/  
> helpers/  
> e2e/  
> specs/  
> docs/  
> GDD/  
> design/  
> codex/

# 6. モジュール責務

| **モジュール** | **主責務**                              |
|----------------|-----------------------------------------|
| time           | 時間停止、1/2/4倍速、日付更新、自動停止 |
| map            | 城、街道、軍団位置、選択、カメラ        |
| domestic       | 内政命令、進捗、完了効果                |
| general        | 武将状態、移動、登用、俸禄              |
| diplomacy      | 外交関係、同盟、停戦、臣従              |
| army           | 軍団編成、行軍、補給                    |
| siege          | 包囲、強攻、降伏勧告                    |
| battle         | 部隊命令、戦闘解決、地形補正            |
| ai             | 内政、外交、軍事、合戦判断              |
| event          | 条件評価、選択肢、効果適用              |
| save           | 保存、読込、検証、移行                  |

モジュール間の変更は公開されたinterfaceまたはApplication Use Caseを通す。内部実装への直接参照は禁止する。

# 7. 状態管理

## 7.1 Zustandの分割

| **Store**     | **内容**                       |
|---------------|--------------------------------|
| gameStore     | GameState、ゲーム内状態        |
| uiStore       | 選択対象、開閉パネル、モーダル |
| settingsStore | 音量、自動停止、表示設定       |

- gameStoreは正規化されたRecord形式を保持する。

- 派生値はselectorで算出し、重複保存しない。

- Reactは必要なselectorだけ購読する。

- Phaserはstore全体を購読せず、Bridgeから差分イベントを受け取る。

> const selectOwnedCastles = (state: GameStore, clanId: ClanId) =\>  
> Object.values(state.game.castles).filter(  
> (castle) =\> castle.ownerClanId === clanId,  
> );

# 8. Phaser・React連携

PhaserとReactは直接互いの内部状態を操作せず、型付きBridgeを介して通信する。

> type GameBridgeEvent =  
> \| { type: "castle-selected"; castleId: CastleId }  
> \| { type: "army-selected"; armyId: ArmyId }  
> \| { type: "open-battle"; battleId: BattleId }  
> \| { type: "map-state-updated"; payload: MapRenderDto };  
>   
> interface GameBridge {  
> emit(event: GameBridgeEvent): void;  
> subscribe\<T extends GameBridgeEvent\["type"\]\>(  
> type: T,  
> listener: (event: Extract\<GameBridgeEvent, { type: T }\>) =\> void,  
> ): () =\> void;  
> }

- Bridgeイベントは判別可能unionで定義する。

- unsubscribe関数を必須とし、React StrictModeの二重購読を防ぐ。

- Phaser Sceneの再生成時に購読を破棄する。

- DOMイベントや任意文字列イベントを直接使用しない。

# 9. ゲームループと時間進行

描画フレームとゲームシミュレーション更新を分離する。

| **処理**         | **方式**                              |
|------------------|---------------------------------------|
| 描画             | requestAnimationFrame / Phaser update |
| シミュレーション | 固定時間ステップ                      |
| 倍速             | 1回の描画で複数simulation tickを処理  |
| 一時停止         | simulation tick停止、UI描画継続       |

> const SIMULATION_TICK_MS = 250;  
>   
> interface SimulationClock {  
> timeScale: 0 \| 1 \| 2 \| 4;  
> accumulatorMs: number;  
> }

- 端末性能差で結果が変わらないよう固定ステップを使用する。

- 1フレームの最大処理tick数を制限し、復帰時の暴走を防ぐ。

- バックグラウンド移行時は自動停止する。

- 自動停止条件は設定値を参照する。

# 10. 全国マップ

| **要素** | **Phaser実装**             |
|----------|----------------------------|
| 城       | 再利用可能なGameObject     |
| 街道     | Graphicsまたは静的レイヤー |
| 軍団     | オブジェクトプール対象     |
| 勢力範囲 | 低頻度更新レイヤー         |
| 選択表示 | 専用オーバーレイ           |
| カメラ   | パン、ズーム、境界制限     |

- 城や軍団の表示オブジェクトへゲーム状態を直接保持しない。

- 描画用DTOから表示を同期する。

- 画面外のラベル・エフェクトは非表示にする。

- 10城規模でも全国版への拡張を想定し、全件再生成を避ける。

# 11. 内政・武将・外交

各操作はCommandとしてApplication層へ渡し、Domain検証後に状態を更新する。

> interface StartDomesticTaskCommand {  
> readonly castleId: CastleId;  
> readonly generalId: GeneralId;  
> readonly taskType: DomesticTaskType;  
> }  
>   
> type CommandResult\<T\> =  
> \| { ok: true; value: T }  
> \| { ok: false; error: DomainError };

- UIは成功率・費用・所要時間の予測をQueryで取得する。

- 実行時に再検証し、表示後に状態が変化した場合の不正操作を防ぐ。

- 外交結果はAI判断ログと理由コードを生成する。

- ゲームルール上のエラーは例外ではなくDomainErrorとして返す。

# 12. 軍団・行軍・攻城

| **機能** | **実装方針**                     |
|----------|----------------------------------|
| 軍団編成 | 不変条件検証後に一括更新         |
| 経路探索 | 街道グラフ上の最短所要時間       |
| 行軍     | 開始時に経路を確定、tickで進捗   |
| 補給     | 定期tickで軍団資金を減算         |
| 攻城     | 状態機械で包囲・強攻・降伏を管理 |

> type SiegeState =  
> \| { type: "none" }  
> \| { type: "encirclement"; startedAt: GameDate; progress: number }  
> \| { type: "assault"; phase: "preparing" \| "fighting" \| "resolved" }  
> \| { type: "negotiation"; requestedAt: GameDate };

行軍中の軍団を城所属と同時に扱わない。位置状態は一意に表現する。

# 13. 合戦

合戦は全国マップとは別のPhaser Sceneで実装し、DomainのBattleStateを描画する。

| **構成**           | **責務**                           |
|--------------------|------------------------------------|
| BattleDomain       | 命中、損害、士気、疲労、地形補正   |
| BattleScene        | 部隊表示、入力、カメラ、エフェクト |
| BattleAI           | 命令候補評価                       |
| BattleResultMapper | 全国状態へ結果反映                 |

- 命令入力中の一時停止を可能にする。

- 最大5対5部隊を前提とする。

- 衝突判定・射程計算と演出を分離する。

- パーティクルはオブジェクトプールを利用する。

- 戦闘結果の乱数は保存可能なRNGから取得する。

# 14. AIアーキテクチャ

> Observe -\> Generate Candidates -\> Score -\> Select -\> Execute -\> Log Reasons

| **AI** | **評価対象**                           |
|--------|----------------------------------------|
| 内政AI | 収入不足、民忠、治安、防御、訓練       |
| 外交AI | 距離、隣接、戦力差、友好、共通敵、性格 |
| 軍事AI | 目標価値、到達時間、防衛余力、補給     |
| 合戦AI | 地形、兵科、士気、側背面、撤退条件     |
| 従属AI | 宗主方針、自勢力防衛、指定目標         |

- AIはルールベースとし、機械学習モデルを使用しない。

- 候補ごとのスコア内訳を保存できる構造にする。

- 乱数だけで行動を選択しない。

- 重要判断はUIで理由を表示可能にする。

# 15. イベントシステム

イベント条件・選択肢・効果は構造化データとして読み込み、登録済み評価器・効果適用器で処理する。

> interface EventConditionEvaluator {  
> supports(type: EventConditionType): boolean;  
> evaluate(condition: EventCondition, state: GameState): boolean;  
> }  
>   
> interface EventEffectApplier {  
> supports(type: EventEffectType): boolean;  
> apply(effect: EventEffect, state: GameState): GameState;  
> }

- eval、Functionコンストラクタ、任意スクリプト実行は禁止する。

- イベント発火はtick終了後の安全なタイミングで処理する。

- oncePerGameイベントは履歴で重複発火を防ぐ。

# 16. 永続化

Application層は保存先を意識せず、SaveRepository interfaceへ依存する。

> interface SaveRepository {  
> list(): Promise\<readonly SaveMetadata\[\]\>;  
> load(saveId: string): Promise\<SaveEnvelope\>;  
> save(envelope: SaveEnvelope): Promise\<void\>;  
> delete(saveId: string): Promise\<void\>;  
> }

1.  GameStateをスナップショット化する。

2.  スキーマ検証と整合性検証を行う。

3.  checksumを計算する。

4.  一時領域へ書き込む。

5.  読込確認後に正式スロットへ置換する。

6.  失敗時は既存セーブを維持する。

# 17. IndexedDB・SQLite抽象化

| **環境**      | **実装**                |
|---------------|-------------------------|
| Web           | IndexedDbSaveRepository |
| iOS / Android | SqliteSaveRepository    |
| テスト        | InMemorySaveRepository  |

- Repository契約テストを3実装へ共通適用する。

- Capacitor判定をDomainやUIへ散在させない。

- Webとモバイルで保存形式SaveEnvelopeを共通化する。

- SQLiteテーブルはセーブ単位のメタデータとpayloadを分離できる構造にする。

# 18. エラー処理

| **分類**            | **例**                   | **処理**                       |
|---------------------|--------------------------|--------------------------------|
| DomainError         | 資金不足、不正な軍団編成 | UIへ理由表示                   |
| ValidationError     | JSON不正、参照欠落       | 起動・ロード中断               |
| PersistenceError    | 保存失敗、容量不足       | 既存データ維持、再試行案内     |
| InfrastructureError | 素材読込失敗             | フォールバックまたはエラー画面 |
| UnexpectedError     | 未想定例外               | ログ記録、致命画面             |

- 例外を握り潰さない。

- ユーザー向け文言と開発者向け詳細を分離する。

- Promise rejectionを未処理で残さない。

- Error BoundaryをReact画面境界へ配置する。

# 19. パフォーマンス

| **対象** | **方針**                                       |
|----------|------------------------------------------------|
| React    | selector最小化、memo、安定した参照             |
| Phaser   | プール、カリング、差分更新                     |
| AI       | 更新頻度を分散、全勢力同一tick評価を避ける     |
| セーブ   | 必要時のみシリアライズ、UIスレッド占有を抑える |
| データ   | 正規化Record、ID直接参照                       |

- 通常時60FPS、最低30FPSを目標とする。

- 不要なオブジェクト生成を避ける。

- プロファイル結果なしに早計な最適化を行わない。

- 性能劣化には再現シナリオと計測値を残す。

# 20. UIアーキテクチャ

| **UI種別**         | **実装**                      |
|--------------------|-------------------------------|
| 画面・パネル       | React                         |
| 全国マップ         | Phaser                        |
| 合戦フィールド     | Phaser                        |
| モーダル・イベント | React                         |
| HUD                | Reactを基本、必要時のみPhaser |

- スマートフォン縦画面を基準とする。

- 主要操作は画面下部へ配置する。

- 長押しを必須操作にしない。

- 重要命令は予測値と確認を表示する。

- UIはドメイン状態を直接変更せずCommandを発行する。

# 21. モバイル対応

| **項目**         | **方針**                       |
|------------------|--------------------------------|
| アプリ化         | Capacitor                      |
| 画面方向         | 縦画面基本、合戦横画面は未確定 |
| 安全領域         | CSS env(safe-area-inset-\*)    |
| 入力             | Pointer Eventsで統一           |
| バックグラウンド | 自動停止・保存候補             |
| 端末回転         | 状態を維持し再レイアウト       |

合戦画面の横画面固定はGDDで検討事項のため、承認前に固定実装しない。

# 22. テスト戦略

| **層**      | **ツール**               | **対象**                         |
|-------------|--------------------------|----------------------------------|
| Unit        | Vitest                   | 計算、状態遷移、AIスコア         |
| Integration | Vitest                   | Use Case、Repository契約、Bridge |
| Component   | Vitest + Testing Library | React UI                         |
| E2E         | Playwright               | 新規開始、内政、出兵、保存・読込 |
| Visual      | Playwright screenshot    | 主要画面のレイアウト             |

- ロジック追加時は正常系・境界値・不正入力をテストする。

- バグ修正時は再発防止テストを追加する。

- 乱数利用テストは固定seedを使用する。

- セーブ・ロード後の状態一致を検証する。

- 主要操作をスマートフォンviewportでE2E検証する。

# 23. ビルド・CI

> Required checks:  
> 1. npm run lint  
> 2. npm run typecheck  
> 3. npm run test  
> 4. npm run build  
> 5. npm run test:e2e (対象変更時)

- ViteでWebビルドを行う。

- CIはGitHub Actionsを使用する。

- mainへの統合前に必須チェックを通す。

- 依存更新と機能実装を同一コミットへ混在させない。

- Conventional Commitsを使用する。

# 24. ログ・デバッグ

| **ログ**    | **内容**                 |
|-------------|--------------------------|
| domain      | 重要な状態遷移と失敗理由 |
| ai          | 候補スコア、選択理由     |
| save        | 保存・読込・移行結果     |
| performance | 長時間tick、描画遅延     |
| error       | 例外、スタック、文脈     |

- 本番では詳細ログを抑制する。

- console.logを残さずLogger interfaceを使用する。

- 個人情報は記録しない。

- AI判断ログはデバッグUIから確認可能な設計にする。

# 25. セキュリティ

- 外部データはunknownとして検証する。

- イベントやセーブデータから任意コードを実行しない。

- HTML文字列を直接描画しない。

- 依存ライブラリの脆弱性を定期確認する。

- 縦切り試作ではオンライン通信・アカウント・個人情報を扱わない。

# 26. アクセシビリティ

- 勢力識別を色だけに依存しない。

- タッチ対象を十分な大きさにする。

- テキストサイズ設定を用意する。

- モーション低減設定を用意する。

- React UIには適切なラベルとフォーカス順を設定する。

- キーボード・マウス・タッチ入力を可能な範囲で共通化する。

# 27. バージョニング

| **対象**       | **方式**                      |
|----------------|-------------------------------|
| アプリ         | Semantic Versioning           |
| セーブスキーマ | 独立したschemaVersion         |
| マスターデータ | データ版をシナリオへ記録      |
| 移行処理       | fromVersion → toVersionの連鎖 |

公開後のID変更は原則禁止する。変更が必要な場合はデータ移行表とセーブ移行を同時に実装する。

# 28. 実装フェーズ

| **Phase** | **内容** | **主要成果** |
|---|---|---|
| 01 | プロジェクト初期構築 | Vite、React、Phaser、TypeScript、Zustand、テスト、CI |
| 02 | 全国マップ | 城、街道、勢力識別、カメラ、選択、表示基盤 |
| 03 | 時間進行 | 一時停止、1/2/4倍速、固定時間ステップ |
| 04 | 城と内政 | 城詳細、内政命令、進捗、完了効果 |
| 05 | 武将 | 武将状態、移動、登用、俸禄 |
| 06 | 外交 | 友好、同盟、停戦、宣戦、臣従 |
| 07 | 軍団と行軍 | 軍団編成、経路探索、移動、補給 |
| 08 | 攻城戦 | 包囲、強攻、降伏勧告、落城処理 |
| 09 | 合戦 | 部隊、地形、兵科、士気、疲労 |
| 10 | AI | 内政・外交・軍事・合戦AI、理由ログ |
| 11 | イベント | 歴史イベント、条件、選択肢、効果 |
| 12 | セーブ・ロード | IndexedDB、SQLite、移行、破損復旧 |
| 13 | モバイル対応 | Capacitor、iOS、Android、タッチ最適化 |
| 14 | リリース準備 | 総合テスト、性能確認、公開準備 |

Phase02は全国マップだけを対象とし、時間進行はPhase03で実装する。

# 29. 未確定事項

以下はGDDで未確定であり、本書では実装仕様として固定しない。

- 具体的なゲーム数値・計算式

- 合戦画面の横画面固定

- 戦場マップの具体的な座標・サイズ

- AI評価重みの具体値

- 自動保存の正確なタイミング競合処理

- 正式版の全国規模におけるLOD閾値

- App Store・Google Play向け課金実装

必要時は仕様変更提案を作成し、承認後にGDDを更新してから実装する。

# 30. 完了条件

- レイヤー間の依存方向が守られている。

- DomainがReact・Phaser・Capacitorに依存していない。

- PhaserとReactが型付きBridgeで連携する。

- ゲームロジックがVitestで単体テスト可能である。

- Webとモバイルの保存先がRepositoryで抽象化される。

- AI判断理由を記録・表示できる。

- lint、typecheck、test、buildが成功する。

- スマートフォンviewportで主要操作が成立する。

- GDDにない仕様を独断で実装していない。

# 付録A. 依存ルール

> Allowed:  
> presentation -\> application  
> presentation -\> state  
> application -\> domain  
> infrastructure -\> application ports  
> infrastructure -\> domain types  
>   
> Forbidden:  
> domain -\> react  
> domain -\> phaser  
> domain -\> capacitor  
> domain -\> infrastructure  
> react component -\> persistence implementation  
> phaser scene -\> zustand internal mutation

# 付録B. 代表的なユースケース

> User taps "農業開発"  
> -\> React requests preview query  
> -\> UI displays cost / duration / expected effect  
> -\> User confirms  
> -\> StartDomesticTaskUseCase executes  
> -\> Domain validates general, castle, treasury  
> -\> GameStore commits state  
> -\> Bridge emits castle-state-updated  
> -\> Phaser updates only the affected castle  
> -\> UI notification is displayed

# 付録C. 変更履歴

| **版** | **日付**   | **内容**                                    |
|--------|------------|---------------------------------------------|
| v0.1   | 2026-07-13 | GDD v0.1およびデータ設計書 v0.1に基づく初版 |
